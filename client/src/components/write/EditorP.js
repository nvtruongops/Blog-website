'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { uploadImages, dataURItoBlob } from '@/lib/api';
import styles from './Editor.module.css';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const categories = ['food', 'travelling', 'lifestyle', 'tech'];

export default function EditorP({ post, pflag }) {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const editor = useRef(null);

  const [title, setTitle] = useState(post?.title || '');
  const [description, setDescription] = useState(post?.description || '');
  const [content, setContent] = useState(post?.content || '');
  const [category, setCategory] = useState(post?.category || 'food');
  const [image, setImage] = useState(post?.image || '');
  const [newImage, setNewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Start writing your blog...',
    height: 400,
  }), []);

  const handleImageChange = (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        setNewImage(event.target.result);
        setImage('');
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !content || (!image && !newImage)) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = image;

      if (newImage) {
        const path = `${user.name}/posts`;
        const img = dataURItoBlob(newImage);
        const formData = new FormData();
        formData.append('path', path);
        formData.append('file', img);

        const uploadedImage = await uploadImages(formData, user.token);
        imageUrl = uploadedImage[0].url;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/editPost`,
        {
          id: post._id,
          title,
          description,
          content,
          category,
          image: imageUrl,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      router.push(`/article/${post._id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Edit Post</h1>
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
          {(image || newImage) && (
            <div className={styles.preview}>
              <img src={newImage || image} alt="Preview" />
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
          {loading ? 'Updating...' : 'Update Post'}
        </button>
      </form>
    </div>
  );
}
