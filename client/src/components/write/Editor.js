'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { uploadImages, dataURItoBlob } from '@/lib/api';
import styles from './Editor.module.css';

const JoditEditor = dynamic(() => import('jodit-react'), { 
  ssr: false,
  loading: () => <p>Loading editor...</p>
});

const categories = ['food', 'travelling', 'lifestyle', 'tech'];

export default function Editor() {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const editor = useRef(null);
  const [mounted, setMounted] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('food');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Start writing your blog...',
    height: 400,
    uploader: {
      insertImageAsBase64URI: true
    }
  }), []);

  const handleImageChange = (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        setImage(event.target.result);
        setError('');
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    if (!image) {
      setError('Cover image is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const path = `${user.name}/posts`;
      const img = dataURItoBlob(image);
      const formData = new FormData();
      formData.append('path', path);
      formData.append('file', img);

      const uploadedImage = await uploadImages(formData, user.token);
      
      if (!uploadedImage || !uploadedImage[0]?.url) {
        throw new Error('Failed to upload image');
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/post`,
        {
          title: title.trim(),
          description: description.trim(),
          content,
          category,
          image: uploadedImage[0].url,
          user: user.id,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      router.push('/');
    } catch (error) {
      console.error('Post creation error:', error);
      setError(error.response?.data?.message || error.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className={styles.container}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1>Create New Post</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
          />
        </div>

        <div className={styles.field}>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your post"
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Cover Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {image && (
            <div className={styles.preview}>
              <img src={image} alt="Preview" />
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label>Content</label>
          <JoditEditor
            ref={editor}
            value={content}
            config={config}
            onBlur={(newContent) => setContent(newContent)}
          />
        </div>

        {error && <span className={styles.error}>{error}</span>}

        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? 'Publishing...' : 'Publish Post'}
        </button>
      </form>
    </div>
  );
}
