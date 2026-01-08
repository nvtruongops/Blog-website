import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Get JWT token from user cookie
 * @returns {string|null} JWT token or null
 */
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const userCookie = Cookies.get('user');
  if (userCookie) {
    try {
      const userData = JSON.parse(userCookie);
      return userData?.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * CSRF Token Management
 * Requirement 6.2: Frontend SHALL include CSRF tokens in all state-changing requests
 */
let csrfToken = null;

/**
 * Fetch CSRF token from backend
 * @returns {Promise<string|null>} CSRF token or null if failed
 */
export const fetchCSRFToken = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error.message);
    return null;
  }
};

/**
 * Get current CSRF token, fetching if necessary
 * @returns {Promise<string|null>} CSRF token
 */
export const getCSRFToken = async () => {
  if (!csrfToken) {
    await fetchCSRFToken();
  }
  return csrfToken;
};

/**
 * Clear CSRF token (call on logout)
 */
export const clearCSRFToken = () => {
  csrfToken = null;
};

/**
 * Create axios instance with CSRF token handling
 * Requirement 6.2: Include CSRF tokens in state-changing requests
 */
const createSecureAxios = () => {
  const instance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  // Add CSRF token and JWT auth to state-changing requests
  instance.interceptors.request.use(async (config) => {
    const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (stateChangingMethods.includes(config.method?.toUpperCase())) {
      const token = await getCSRFToken();
      if (token) {
        config.headers['X-CSRF-Token'] = token;
      }
      
      // Add JWT token for authenticated requests
      const authToken = getAuthToken();
      if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
      }
    }
    return config;
  });

  // Handle response errors with improved error handling
  // Requirement 9.3: Validate all API responses before processing
  instance.interceptors.response.use(
    (response) => {
      // Update CSRF token if provided in response headers
      const newToken = response.headers['x-csrf-token'];
      if (newToken) {
        csrfToken = newToken;
      }
      return response;
    },
    (error) => {
      // Handle CSRF token errors - refresh token and retry
      if (error.response?.status === 403 && 
          error.response?.data?.message?.includes('CSRF')) {
        csrfToken = null; // Clear invalid token
      }
      
      // Handle authentication errors silently - let calling code handle it
      // 401 errors are expected when user is not logged in

      // Handle rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        console.warn(`Rate limited. Retry after: ${retryAfter}s`);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const secureAxios = createSecureAxios();

/**
 * Standardized error response handler
 * Requirement 9.3: Validate all API responses before processing
 * @param {Error} error - Axios error object
 * @param {string} defaultMessage - Default error message
 * @returns {Object} Standardized error response
 */
const handleApiError = (error, defaultMessage = 'An error occurred') => {
  // Don't expose internal error details to client
  const safeMessage = error.response?.data?.message || defaultMessage;
  
  return {
    success: false,
    msg: 'error',
    message: safeMessage,
    status: error.response?.status || 500,
  };
};

/**
 * Validate API response structure
 * Requirement 9.3: Validate all API responses before processing
 * @param {Object} data - Response data
 * @returns {boolean} Whether response is valid
 */
const isValidResponse = (data) => {
  return data !== null && data !== undefined && typeof data === 'object';
};

export const clearCookie = (cookieName) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

export const checkifverify = async (mail) => {
  try {
    const { data } = await secureAxios.post('/checkifverify', { mail });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Verification check failed');
  }
};

export const checkotpv = async (mail, otp) => {
  try {
    const { data } = await secureAxios.post('/checkotpv', { mail, otp });
    if (!isValidResponse(data)) return { msg: 'error in sending mail' };
    return data;
  } catch (error) {
    return handleApiError(error, 'OTP verification failed');
  }
};

export const sendmail = async (mail, name) => {
  try {
    const { data } = await secureAxios.post('/sendmail', { mail, name });
    if (!isValidResponse(data)) return { msg: 'error in sending mail' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to send mail');
  }
};

export const increaseView = async (id) => {
  try {
    const { data } = await secureAxios.post('/increaseView', { id });
    if (!isValidResponse(data)) return { msg: 'error in increasing view' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to increase view');
  }
};

export const getView = async (id) => {
  try {
    const { data } = await secureAxios.post('/getView', { id });
    if (!isValidResponse(data)) return { msg: 'error in getting view' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to get view');
  }
};

export const getLikes = async (id) => {
  try {
    const { data } = await secureAxios.post('/getLikes', { id });
    if (!isValidResponse(data)) return { msg: 'error in getting likes' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to get likes');
  }
};

export const uploadImages = async (formData, token = null) => {
  try {
    const csrfTokenValue = await getCSRFToken();
    const { data } = await axios.post(`${API_URL}/uploadImages`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'X-CSRF-Token': csrfTokenValue,
      },
      withCredentials: true,
    });
    if (!isValidResponse(data)) return 'Upload failed';
    return data;
  } catch (error) {
    return error.response?.data?.message || 'Upload failed';
  }
};

export const getarticle = async (id) => {
  try {
    const { data } = await secureAxios.post('/getarticle', { id });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to get article');
  }
};

export const getAllPost = async (page, category) => {
  try {
    const size = 10;
    const { data } = await secureAxios.post(
      `/getallpost?page=${page}&size=${size}`, 
      { mpost: category }
    );
    if (!isValidResponse(data)) return { msg: [], total: 0 };
    return { msg: data.posts || [], total: data.total };
  } catch (error) {
    return { msg: [], total: 0 };
  }
};

export const getUser = async (userId) => {
  try {
    const { data } = await secureAxios.get(`/getUser/${userId}`);
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to get user');
  }
};

export const bookmark = async (postid, userid) => {
  try {
    const { data } = await secureAxios.post('/setbookmark', { postid, userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to set bookmark');
  }
};

export const deletebookmark = async (postid, userid) => {
  try {
    const { data } = await secureAxios.post('/deletebookmark', { postid, userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to delete bookmark');
  }
};

export const checkbookmark = async (postid, userid) => {
  try {
    const { data } = await secureAxios.post('/checkbookmark', { postid, userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to check bookmark');
  }
};

export const likes = async (postid, userid) => {
  try {
    const { data } = await secureAxios.post('/setlikes', { postid, userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to set like');
  }
};

export const deletelikes = async (postid, userid) => {
  try {
    const { data } = await secureAxios.post('/deletelikes', { postid, userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to delete like');
  }
};

export const checklikes = async (postid, userid) => {
  try {
    const { data } = await secureAxios.post('/checklikes', { postid, userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to check like');
  }
};

export const increaseLike = async (id) => {
  try {
    const { data } = await secureAxios.post('/increaseLike', { id });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to increase like');
  }
};

export const decreastLike = async (id) => {
  try {
    const { data } = await secureAxios.post('/decreastLike', { id });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to decrease like');
  }
};

export const createcomment = async (name, image, comment, commentBy, postId, token) => {
  try {
    const csrfTokenValue = await getCSRFToken();
    const { data } = await axios.post(`${API_URL}/postcomment`, {
      name, image, content: comment, commentBy, postId
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfTokenValue,
      },
      withCredentials: true,
    });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to create comment');
  }
};

export const getcomment = async (postId) => {
  try {
    const { data } = await secureAxios.post('/getcomment', { id: postId });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to get comments');
  }
};

export const reportcontent = async (pid, postid, userid, name1, name2, reason) => {
  try {
    const { data } = await secureAxios.post('/reportcontent', {
      pid, postid, userid, name1, name2, reason
    });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to report content');
  }
};

export const startfollow = async (userid, followid) => {
  try {
    const { data } = await secureAxios.post('/startfollow', { id: userid, id2: followid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to follow user');
  }
};

export const unfollow = async (userid, followid) => {
  try {
    const { data } = await secureAxios.post('/unfollow', { id: userid, id2: followid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to unfollow user');
  }
};

export const checkfollowing = async (userid, followid) => {
  try {
    const { data } = await secureAxios.post('/checkfollow', { id: userid, id2: followid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to check following');
  }
};

export const getfollowercount = async (userid) => {
  try {
    const { data } = await secureAxios.post('/countfollower', { id: userid });
    if (!isValidResponse(data)) return { data: { msg: 0 } };
    return { data };
  } catch (error) {
    return { data: { msg: 0 } };
  }
};

export const getfollowingcount = async (userid) => {
  try {
    const { data } = await secureAxios.post('/countfollowing', { id: userid });
    if (!isValidResponse(data)) return { data: { msg: 0 } };
    return { data };
  } catch (error) {
    return { data: { msg: 0 } };
  }
};

export const fetchprof = async (userid) => {
  try {
    const { data } = await secureAxios.post('/fetchprof', { userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch profile');
  }
};

export const showbookmarks = async (userid) => {
  try {
    const response = await secureAxios.post('/showbookmarks', { id: userid });
    if (!isValidResponse(response.data)) return { msg: 'error' };
    return response;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const showLikemarks = async (userid) => {
  try {
    const response = await secureAxios.post('/showLikemarks', { id: userid });
    if (!isValidResponse(response.data)) return { msg: 'error' };
    return response;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const showmyposts = async (userid) => {
  try {
    const { data } = await secureAxios.post('/showmyposts', { id: userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to show posts');
  }
};

export const fetchfollowing = async (userid) => {
  try {
    const { data } = await secureAxios.post('/fetchfollowing', { id: userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch following');
  }
};

export const changeabout = async (about, userid) => {
  try {
    const { data } = await secureAxios.post('/changeabout', { about, id: userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to change about');
  }
};

export const searchresult = async (query) => {
  try {
    const { data } = await secureAxios.post('/searchresult', { query });
    if (!isValidResponse(data)) return { msg: [] };
    return data;
  } catch (error) {
    return { msg: [] };
  }
};

export const getallpostdata = async (id) => {
  try {
    const response = await secureAxios.post('/getallpostdata', { id });
    if (!isValidResponse(response.data)) return { msg: 'error' };
    return response;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const deletepost = async (postid, userid, token) => {
  try {
    const csrfTokenValue = await getCSRFToken();
    const { data } = await axios.post(`${API_URL}/deletepost`, { postid, userid }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfTokenValue,
      },
      withCredentials: true,
    });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to delete post');
  }
};

export const uploadProfilePicture = async (url, about, token) => {
  try {
    const csrfTokenValue = await getCSRFToken();
    const { data } = await axios.put(
      `${API_URL}/uploadprofile`,
      { url, about },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrfTokenValue,
        },
        withCredentials: true,
      }
    );
    if (!isValidResponse(data)) throw new Error('Invalid response');
    return data;
  } catch (error) {
    throw error;
  }
};

export const dataURItoBlob = (dataURI) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export const getallLikes = async (userid) => {
  try {
    const { data } = await secureAxios.post('/getallLikes', { userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to get likes');
  }
};

export const getallBookmarks = async (userid) => {
  try {
    const { data } = await secureAxios.post('/getallBookmarks', { userid });
    if (!isValidResponse(data)) return { msg: 'error' };
    return data;
  } catch (error) {
    return handleApiError(error, 'Failed to get bookmarks');
  }
};

export const setPassword = async (userid, password, token) => {
  try {
    const csrfTokenValue = await getCSRFToken();
    const { data } = await axios.post(
      `${API_URL}/setpassword`,
      { userid, password },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrfTokenValue,
        },
        withCredentials: true,
      }
    );
    if (!isValidResponse(data)) return { msg: 'error', error: 'Invalid response' };
    return data;
  } catch (error) {
    return { msg: 'error', error: error.response?.data?.message || 'Failed to set password' };
  }
};

export const changeUserPassword = async (userid, oldPassword, newPassword, token) => {
  try {
    const csrfTokenValue = await getCSRFToken();
    const { data } = await axios.post(
      `${API_URL}/changeuserpassword`,
      { userid, oldPassword, newPassword },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrfTokenValue,
        },
        withCredentials: true,
      }
    );
    if (!isValidResponse(data)) return { success: false, error: 'Invalid response' };
    return data;
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'An error occurred' };
  }
};

export const checkHasPassword = async (userid) => {
  try {
    const { data } = await secureAxios.post('/checkhaspassword', { userid });
    if (!isValidResponse(data)) return { hasPassword: true };
    return data;
  } catch (error) {
    return { hasPassword: true };
  }
};
