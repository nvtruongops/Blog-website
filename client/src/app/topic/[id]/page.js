'use client';

import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import Navbar from '@/components/Navbar';
import Card from '@/components/home/Card';
import Breaker from '@/components/home/Breaker';
import Posts from '@/components/home/Posts';
import Footer from '@/components/Footer';

export default function TopicPage() {
  const params = useParams();
  const category = params.id;
  const user = useSelector((state) => state.user);

  return (
    <div className="HomePage">
      <Navbar user={user} />
      <Card />
      <Breaker text={`${category.charAt(0).toUpperCase() + category.slice(1)} Posts`} />
      <Posts category={category} />
      <Footer />
    </div>
  );
}
