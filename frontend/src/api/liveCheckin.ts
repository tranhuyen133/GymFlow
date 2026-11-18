/** V56 · Mã check-in động trên màn hình quầy. Đối chiếu backend CheckinService.LiveCode. */
export interface LiveCode {
  /** 6 số, chỉ một hội viên dùng được */
  code: string;
  /** Số giây còn lại trước khi màn hình đổi mã */
  secondsLeft: number;
  ttlSeconds: number;
  url: string;
  /** Mỗi chuỗi là một hàng của mã QR: '1' ô đen, '0' ô trắng. */
  qr: string[];
}
