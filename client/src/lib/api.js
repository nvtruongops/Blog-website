import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const clearCookie = (cookieName) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

export const checkifverify = async (mail) => {
  try {
    const { data } = await axios.post(`${API_URL}/checkifverify`, { mail });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const checkotpv = async (mail, otp) => {
  try {
    const { data } = await axios.post(`${API_URL}/checkotpv`, { mail, otp });
    return data;
  } catch (error) {
    return { msg: 'error in sending mail' };
  }
};

export const sendmail = async (mail, name) => {
  try {
    const { data } = await axios.post(`${API_URL}/sendmail`, { mail, name });
    return data;
  } catch (error) {
    return { msg: 'error in sending mail' };
  }
};

export const increaseView = async (id) => {
  try {
    const { data } = await axios.post(`${API_URL}/increaseView`, { id });
    return data;
  } catch (error) {
    return { msg: 'error in increasing view' };
  }
};

export const getView = async (id) => {
  try {
    const { data } = await axios.post(`${API_URL}/getView`, { id });
    return data;
  } catch (error) {
    return { msg: 'error in getting view' };
  }
};

export const getLikes = async (id) => {
  try {
    const { data } = await axios.post(`${API_URL}/getLikes`, { id });
    return data;
  } catch (error) {
    return { msg: 'error in getting likes' };
  }
};

export const uploadImages = async (formData, token = null) => {
  try {
    const { data } = await axios.post(`${API_URL}/uploadImages`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'multipart/form-data',
      },
      withCredentials: true,
    });
    return data;
  } catch (error) {
    return error.response?.data?.message;
  }
};

export const getarticle = async (id) => {
  try {
    const { data } = await axios.post(`${API_URL}/getarticle`, { id });
    return data;
  } catch (error) {
    return error;
  }
};

export const getAllPost = async (page, category) => {
  try {
    const size = 10;
    const { data } = await axios.post(
      `${API_URL}/getallpost?page=${page}&size=${size}`, 
      { mpost: category }
    );
    // Backend returns { posts, total, page, size }
    return { msg: data.posts || [], total: data.total };
  } catch (error) {
    return { msg: [] };
  }
};

export const getUser = async (userId) => {
  try {
    const { data } = await axios.get(`${API_URL}/getUser/${userId}`);
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const bookmark = async (postid, userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/setbookmark`, { postid, userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const deletebookmark = async (postid, userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/deletebookmark`, { postid, userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const checkbookmark = async (postid, userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/checkbookmark`, { postid, userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const likes = async (postid, userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/setlikes`, { postid, userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const deletelikes = async (postid, userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/deletelikes`, { postid, userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const checklikes = async (postid, userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/checklikes`, { postid, userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const increaseLike = async (id) => {
  try {
    const { data } = await axios.post(`${API_URL}/increaseLike`, { id });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const decreastLike = async (id) => {
  try {
    const { data } = await axios.post(`${API_URL}/decreastLike`, { id });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const createcomment = async (name, image, comment, commentBy, postId) => {
  try {
    const { data } = await axios.post(`${API_URL}/postcomment`, {
      name, image, content: comment, commentBy, postId
    });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const getcomment = async (postId) => {
  try {
    const { data } = await axios.post(`${API_URL}/getcomment`, { id: postId });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const reportcontent = async (pid, postid, userid, name1, name2, reason) => {
  try {
    const { data } = await axios.post(`${API_URL}/reportcontent`, {
      pid, postid, userid, name1, name2, reason
    });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const startfollow = async (userid, followid) => {
  try {
    const { data } = await axios.post(`${API_URL}/startfollow`, { id: userid, id2: followid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const unfollow = async (userid, followid) => {
  try {
    const { data } = await axios.post(`${API_URL}/unfollow`, { id: userid, id2: followid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const checkfollowing = async (userid, followid) => {
  try {
    const { data } = await axios.post(`${API_URL}/checkfollow`, { id: userid, id2: followid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const getfollowercount = async (userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/countfollower`, { id: userid });
    return { data };
  } catch (error) {
    return { data: { msg: 0 } };
  }
};

export const getfollowingcount = async (userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/countfollowing`, { id: userid });
    return { data };
  } catch (error) {
    return { data: { msg: 0 } };
  }
};

export const fetchprof = async (userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/fetchprof`, { userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const showbookmarks = async (userid) => {
  try {
    const data = await axios.post(`${API_URL}/showbookmarks`, { id: userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const showLikemarks = async (userid) => {
  try {
    const data = await axios.post(`${API_URL}/showLikemarks`, { id: userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const showmyposts = async (userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/showmyposts`, { id: userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const fetchfollowing = async (userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/fetchfollowing`, { id: userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const changeabout = async (about, userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/changeabout`, { about, id: userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const searchresult = async (query) => {
  try {
    const { data } = await axios.post(`${API_URL}/searchresult`, { query });
    return data;
  } catch (error) {
    return { msg: [] };
  }
};

export const getallpostdata = async (id) => {
  try {
    const data = await axios.post(`${API_URL}/getallpostdata`, { id });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const deletepost = async (postid, userid, token) => {
  try {
    const { data } = await axios.post(`${API_URL}/deletepost`, { postid, userid }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const uploadProfilePicture = async (url, about, token) => {
  try {
    const { data } = await axios.put(
      `${API_URL}/uploadprofile`,
      { url, about },
      { headers: { Authorization: `Bearer ${token}` } }
    );
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
    const { data } = await axios.post(`${API_URL}/getallLikes`, { userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const getallBookmarks = async (userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/getallBookmarks`, { userid });
    return data;
  } catch (error) {
    return { msg: 'error' };
  }
};

export const setPassword = async (userid, password, token) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/setpassword`,
      { userid, password },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (error) {
    return { msg: 'error', error: error.response?.data?.message };
  }
};

export const changeUserPassword = async (userid, oldPassword, newPassword, token) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/changeuserpassword`,
      { userid, oldPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Có lỗi xảy ra' };
  }
};

export const checkHasPassword = async (userid) => {
  try {
    const { data } = await axios.post(`${API_URL}/checkhaspassword`, { userid });
    return data;
  } catch (error) {
    return { hasPassword: true };
  }
};
