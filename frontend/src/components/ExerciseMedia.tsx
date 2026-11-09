/**
 * Ảnh minh hoạ bài tập: 2 khung (tư thế đầu / cuối) chạy luân phiên như ảnh động khi `play`
 * (hoặc khi rê chuột nếu `playOnHover`). Không có ảnh thì hiện bản đồ cơ thay thế (fallback).
 */
import { useState, type ReactNode } from 'react';
import { t } from '../i18n';
import { exerciseImage } from '../lib/anatomy';
import { Icon } from './Icon';
import './muscle-map.css';

export function ExerciseMedia({ imageKey, alt, play, playOnHover, tag, className = '', fallback }: {
  imageKey: string | null | undefined; alt: string; play?: boolean; playOnHover?: boolean; tag?: string;
  className?: string; fallback?: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const [broken, setBroken] = useState(false);
  if (!imageKey || broken) {
    return <>{fallback ?? <div className={`ex-media-empty ${className}`}><Icon name="dumbbell" size={28} /></div>}</>;
  }
  const playing = play || (playOnHover && hover);
  return (
    <div className={`ex-media ${playing ? 'playing' : ''} ${className}`}
      onMouseEnter={playOnHover ? () => setHover(true) : undefined} onMouseLeave={playOnHover ? () => setHover(false) : undefined}>
      <img className="f0" src={exerciseImage(imageKey, 0)} alt={alt} loading="lazy" decoding="async" onError={() => setBroken(true)} />
      <img className="f1" src={exerciseImage(imageKey, 1)} alt="" aria-hidden loading="lazy" decoding="async" />
      {tag && <span className="ex-media-tag">{tag}</span>}
    </div>
  );
}

export const MEDIA_CREDIT = 'Ảnh minh hoạ: Free Exercise DB (yuhonas/free-exercise-db), phát hành công cộng (Unlicense).';
export const mediaCredit = () => t(MEDIA_CREDIT);
