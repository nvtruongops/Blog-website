'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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

const categories = [
  { value: 'food', label: 'Ẩm thực' },
  { value: 'travelling', label: 'Du lịch' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'tech', label: 'Công nghệ' }
];

export default function EditorP({ post }) {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategory = categories.find(c => c.value === category);

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Bắt đầu viết bài của bạn...',
    height: 500,
    toolbarAdaptive: false,
    toolbarSticky: false,
    uploader: {
      insertImageAsBase64URI: true
    },
    // Simplified professional toolbar
    buttons: [
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'fontsize', 'paragraph', '|',
      'image', 'link', '|',
      'align', '|',
      'undo', 'redo'
    ],
    // Remove tabs and unnecessary icons
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    showFilesCounter: false,
    showPoweredBy: false,
    // Font options - simplified
    controls: {
      fontsize: {
        list: [
          '12', '14', '16', '18', '20', '24', '28', '32'
        ]
      },
      paragraph: {
        list: {
          p: 'Văn bản',
          h1: 'Tiêu đề 1',
          h2: 'Tiêu đề 2', 
          h3: 'Tiêu đề 3',
          blockquote: 'Trích dẫn',
        }
      }
    },
    // Settings
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
        <h1>Chỉnh sửa bài viết</h1>
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
            <div className={styles.customSelect} ref={dropdownRef}>
              <div 
                className={`${styles.selectTrigger} ${dropdownOpen ? styles.open : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>{selectedCategory?.label}</span>
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path fill="currentColor" d="M6 8L1 3h10z"/>
                </svg>
              </div>
              {dropdownOpen && (
                <div className={styles.selectOptions}>
                  {categories.map((cat) => (
                    <div
                      key={cat.value}
                      className={`${styles.selectOption} ${category === cat.value ? styles.selected : ''}`}
                      onClick={() => {
                        setCategory(cat.value);
                        setDropdownOpen(false);
                      }}
                    >
                      {cat.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              Xóa ảnh
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
          {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}
