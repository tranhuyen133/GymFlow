/**
 * Ảnh minh hoạ bài tập.
 *  - Mã thường (Free Exercise DB): 2 khung tư thế đầu / cuối chạy luân phiên khi `play` (hoặc rê chuột nếu `playOnHover`).
 *  - Mã gv-<id> (exercises-dataset, media © Gym visual): ảnh tĩnh 180×180, chuyển sang GIF động khi `play` / rê chuột.
 *    Giữ nguyên kích thước gốc 180×180 và luôn hiện ghi nguồn.
 * Không có ảnh thì hiện bản đồ cơ thay thế (fallback).
 */
import { useState, type ReactNode } from 'react';
import { t } from '../i18n';
import { exerciseImage, isGifKey } from '../lib/anatomy';
import { Icon } from './Icon';
import './muscle-map.css';

export const GYM_VISUAL_CREDIT = '© Gym visual — https://gymvisual.com/';

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
  const hoverProps = playOnHover ? { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) } : {};

  if (isGifKey(imageKey)) {
    return (
      <div className={`ex-media ex-media-gv ${playing ? 'playing' : ''} ${className}`} {...hoverProps}>
        <img src={exerciseImage(imageKey, 0)} alt={alt} width={180} height={180} loading="lazy" decoding="async"
          onError={() => setBroken(true)} />
        {playing && <img className="gv-anim" src={exerciseImage(imageKey, 1)} alt="" aria-hidden width={180} height={180} decoding="async" />}
        {!playing && playOnHover && <span className="gv-play" aria-hidden><Icon name="play" size={12} /></span>}
        {tag && <span className="ex-media-tag">{tag}</span>}
        <span className="gv-credit">© Gym visual</span>
      </div>
    );
  }

  return (
    <div className={`ex-media ${playing ? 'playing' : ''} ${className}`} {...hoverProps}>
      <img className="f0" src={exerciseImage(imageKey, 0)} alt={alt} loading="lazy" decoding="async" onError={() => setBroken(true)} />
      <img className="f1" src={exerciseImage(imageKey, 1)} alt="" aria-hidden loading="lazy" decoding="async" />
      {tag && <span className="ex-media-tag">{tag}</span>}
    </div>
  );
}

export const MEDIA_CREDIT = 'Ảnh minh hoạ: Free Exercise DB (yuhonas/free-exercise-db), phát hành công cộng (Unlicense). Ảnh động 180×180: © Gym visual — https://gymvisual.com/ (qua hasaneyldrm/exercises-dataset).';
export const mediaCredit = () => t(MEDIA_CREDIT);
