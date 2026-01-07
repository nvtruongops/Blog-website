'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { uploadImages, dataURItoBlob } from '@/lib/api';
import styles from './Editor.module.css';

const JoditEditor = dynamic(() => import('jodit-react'), { 
  ssr: false,
  loading: () => <div className={styles.editorLoading}>Đang tải trình soạn thảo...</div>
});

const categories = ['food', 'travelling', 'lifestyle', 'tech'];

export default function EditorP({ post }) {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const [mounted, setMounted] = useState(false);

  const [title, setTitle] = useState(post?.title || '');
  const [description, setDescription] = useState(post?.description || '');
  const [content, setContent] = useState(post?.content || '');
  const [category, setCategory] = useState(post?.category || 'food');
  const [image, setImage] = useState(post?.image || '');
  const [newImage, setNewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Bắt đầu viết bài của bạn...',
    height: 500,
    toolbarAdaptive: false,
    toolbarSticky: false,
    uploader: {
      insertImageAsBase64URI: true
    },
    // Full toolbar
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', '|',
      'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ],
    // Font options
    controls: {
      font: {
        list: {
          '': '- Font -',
          'Arial, Helvetica, sans-serif': 'Arial',
          'Comic Sans MS, cursive': 'Comic Sans',
          'Courier New, Courier, monospace': 'Courier New',
          'Georgia, serif': 'Georgia',
          'Tahoma, Geneva, sans-serif': 'Tahoma',
          'Times New Roman, Times, serif': 'Times New Roman',
          'Verdana, Geneva, sans-serif': 'Verdana',
        }
      },
      fontsize: {
        list: [
          '8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'
        ]
      },
      paragraph: {
        list: {
          p: 'Văn bản',
          h1: 'Tiêu đề 1',
          h2: 'Tiêu đề 2', 
          h3: 'Tiêu đề 3',
          h4: 'Tiêu đề 4',
          blockquote: 'Trích dẫn',
        }
      }
    },
    // Colors
    colors: [
      '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
      '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
    ],
    // Settings
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
  }), []);

  const handleImageChange = (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Ảnh phải nhỏ hơn 5MB');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        setNewImage(event.target.result);
        setImage('');
        setError('');
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề');
      return;
    }
    if (!description.trim()) {
      setError('Vui lòng nhập mô tả');
      return;
    }
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung');
      return;
    }
    if (!image && !newImage) {
      setError('Vui lòng chọn ảnh bìa');
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
        
        if (!uploadedImage || !uploadedImage[0]?.url) {
          throw new Error('Không thể upload ảnh');
        }
        imageUrl = uploadedImage[0].url;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/editPost`,
        {
          id: post._id,
          title: title.trim(),
          description: description.trim(),
          content,
          category,
          image: imageUrl,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      router.push(`/article/${post._id}`);
    } catch (error) {
      console.error('Post update error:', error);
      setError(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>✏️ Chỉnh sửa bài viết</h1>
        <p>Cập nhật nội dung bài viết của bạn</p>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Tiêu đề</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề bài viết..."
          />
        </div>

        <div className={styles.field}>
          <label>Mô tả ngắn</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn gọn về bài viết của bạn..."
            rows={3}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Danh mục</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'food' ? '🍔 Ẩm thực' : 
                   cat === 'travelling' ? '✈️ Du lịch' : 
                   cat === 'lifestyle' ? '🌿 Lifestyle' : 
                   '💻 Công nghệ'}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Ảnh bìa</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
        </div>

        {(image || newImage) && (
          <div className={styles.preview}>
            <img src={newImage || image} alt="Preview" />
            <button 
              type="button" 
              className={styles.removeImage} 
              onClick={() => { setImage(''); setNewImage(''); }}
            >
              ✕ Xóa ảnh
            </button>
          </div>
        )}

        <div className={styles.field}>
          <label>Nội dung</label>
          <JoditEditor
            value={content}
            config={config}
            onBlur={(newContent) => setContent(newContent)}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? 'Đang cập nhật...' : '💾 Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}
