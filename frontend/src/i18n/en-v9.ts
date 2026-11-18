// Bản dịch đợt v9 (V56): kích hoạt gói ngay + đối soát chuyển khoản, đổi HLV ngay, menu gọn, trợ lý AI có dự phòng.
// Đứng ĐẦU DICT nên chỉ bổ sung, không ghi đè bản dịch đã có.
export const EN_V9: Record<string, string> = {
  // ---- Đổi HLV ngay ----
  'Đã đổi sang HLV {name}. {n} buổi sắp tới đã chuyển theo.': 'Switched to trainer {name}. {n} upcoming sessions moved over.',
  'Có buổi trùng giờ với HLV mới, đã gửi quản lý xếp lại.': 'Some sessions clash with the new trainer, so the request was sent to the manager to reschedule.',
  'Gửi quản lý xếp lại': 'Ask the manager to reschedule',
  'Đổi HLV ngay': 'Switch trainer now',
  'Đổi ngay nếu HLV mới rảnh, không cần chờ duyệt': 'Switches instantly if the new trainer is free – no approval needed',
  'HLV hiện tại': 'Current trainer',
  'Đổi ngay sang': 'Switch now to',
  '{n} buổi sắp tới chuyển theo': '{n} upcoming sessions move over',
  'Chưa có buổi PT sắp tới': 'No upcoming PT sessions',
  'HLV {name} đã có lịch trùng {n} buổi của bạn:': 'Trainer {name} is already booked at {n} of your session times:',
  'Gửi yêu cầu để quản lý xếp lại giờ rồi đổi giúp bạn, hoặc chọn HLV khác.': 'Send a request so the manager can reschedule and switch for you, or pick another trainer.',
  'Lý do (không bắt buộc)': 'Reason (optional)',
  '{n}/255 · HLV mới sẽ thấy để chuẩn bị': '{n}/255 · your new trainer will see this',

  // ---- Chuyển khoản: gói chạy ngay ----
  'Gói đã được kích hoạt! Phòng tập sẽ đối soát giao dịch sau.': 'Your plan is active! The gym will reconcile the transfer later.',
  'Tôi sẽ chuyển khoản {price} đúng nội dung. Gói chạy ngay khi tôi bấm "Tôi đã chuyển khoản"; nếu phòng tập không nhận được tiền, gói sẽ bị thu hồi.':
    'I will transfer {price} with the exact reference. The plan starts as soon as I tap "I have transferred"; if the gym does not receive the money, the plan will be revoked.',
  'Chuyển khoản: ghi đúng nội dung là mã đơn GF…, rồi bấm "Tôi đã chuyển khoản". Gói kích hoạt ngay, quản lý đối soát sau.':
    'Bank transfer: use the order code GF… as the reference, then tap "I have transferred". The plan starts right away; the manager reconciles later.',

  // ---- Đối soát chuyển khoản (quản lý) ----
  'Hội viên & thu tiền': 'Members & payments',
  'Bán hàng': 'Sales',
  'Đối soát chuyển khoản': 'Transfer reconciliation',
  'Đã xác nhận nhận tiền đơn {code}': 'Payment for order {code} confirmed',
  'Gói được kích hoạt ngay khi hội viên báo đã chuyển khoản. Đối chiếu với app ngân hàng rồi xác nhận, hoặc thu hồi nếu không thấy tiền về.':
    'Plans start as soon as a member reports a transfer. Check your banking app, then confirm – or revoke if the money never arrived.',
  'Máy chủ đang tắt kích hoạt ngay (PAYMENT_INSTANT_ACTIVATION=false): đơn chuyển khoản vẫn chờ duyệt ở mục Duyệt đăng ký gói.':
    'Instant activation is off on the server (PAYMENT_INSTANT_ACTIVATION=false): transfer orders still wait in Plan requests.',
  'Chờ đối soát ({n})': 'Awaiting reconciliation ({n})',
  'Chờ đối soát': 'Awaiting reconciliation',
  'Không có giao dịch nào chờ đối soát': 'Nothing to reconcile',
  'Đơn chuyển khoản mới sẽ hiện ở đây ngay khi hội viên bấm “Tôi đã chuyển khoản”.': 'New transfer orders appear here as soon as a member taps “I have transferred”.',
  'Nội dung CK': 'Reference',
  'Kích hoạt lúc': 'Activated at',
  'Đã nhận tiền': 'Money received',
  'Đơn nâng cấp PT: vào Đăng ký gói để xử lý': 'PT upgrade order: handle it in Subscriptions',
  'Thu hồi': 'Revoke',
  'Đã xử lý gần đây': 'Recently handled',
  'Kết quả': 'Result',
  'Đã thu hồi': 'Revoked',
  'Lý do từ 5 đến 200 ký tự': 'Reason must be 5 to 200 characters',
  'Đã thu hồi gói của đơn {code}': 'Plan from order {code} revoked',
  'Thu hồi gói – đơn {code}': 'Revoke plan – order {code}',
  'Thu hồi gói': 'Revoke plan',
  'Gói {plan} của {name} sẽ bị huỷ ngay, quà tặng kèm bị huỷ và lượt ưu đãi được trả lại. Chỉ thu hồi khi chắc chắn chưa nhận được {money}.':
    "{name}'s {plan} plan will be cancelled immediately, bundled gifts cancelled and the offer use returned. Only revoke if you are sure {money} was not received.",
  'Lý do (hội viên sẽ thấy)': 'Reason (the member will see this)',
  '{n}/200': '{n}/200',
  'VD: sau 2 ngày chưa thấy giao dịch GF… trong tài khoản': 'E.g. no GF… transaction in the account after 2 days',
  'Mở app ngân hàng, tìm giao dịch có nội dung đúng mã đơn (GF…) và đúng số tiền trong bảng.': 'Open your banking app and find the transaction whose reference matches the order code (GF…) and the amount in the table.',
  'Thấy tiền: bấm “Đã nhận tiền”. Đơn chuyển sang mục Đã xử lý, bạn được ghi là người duyệt.': 'Found it: tap “Money received”. The order moves to Recently handled with you as the approver.',
  'Không thấy tiền sau khi đã chờ: bấm “Thu hồi”, nhập lý do. Gói vừa kích hoạt bị huỷ, lượt ưu đãi được trả lại, hội viên thấy lý do trong mục Đơn đăng ký.':
    'Still no money after waiting: tap “Revoke” and give a reason. The plan is cancelled, the offer use is returned and the member sees the reason under their orders.',
  'Mỗi hội viên chỉ được một đơn tự kích hoạt chưa đối soát; đơn tiếp theo sẽ chờ bạn duyệt ở mục Duyệt đăng ký gói.':
    'Each member can have only one unreconciled instant order; the next one waits for you in Plan requests.',

  // ---- Menu gọn ----
  'Hiện mục nâng cao': 'Show advanced items',
  'Ẩn mục nâng cao': 'Hide advanced items',

  // ---- Thông báo từ máy chủ ----
  'Gói này đang có một yêu cầu chờ quản lý duyệt. Huỷ yêu cầu đó nếu muốn đổi HLV.': 'This plan already has a request waiting for approval. Cancel it to switch trainers.',
  'Chỉ gói có huấn luyện viên (PT) còn hiệu lực mới đổi được HLV': 'Only an active plan with a personal trainer (PT) can switch trainers',
  'Bạn chưa có gói kèm huấn luyện viên (PT) còn hiệu lực': 'You have no active plan with a personal trainer (PT)',
  'Chọn huấn luyện viên mới': 'Choose a new trainer',
  'Đơn này không được tự kích hoạt': 'This order was not activated automatically',
  'Đơn này đã được đối soát': 'This order has already been reconciled',
  'Đơn này vừa được đối soát': 'This order was just reconciled',
  'Đơn nâng cấp lên PT đã cắt ngắn gói cũ, không thu hồi tự động được. Vào Đăng ký gói để huỷ gói PT và sửa lại thời gian gói cũ.':
    'A PT upgrade order shortened the previous plan, so it cannot be revoked automatically. Go to Subscriptions to cancel the PT plan and restore the old dates.',
  // ---- Check-in bằng mã động trên màn hình quầy ----
  'GymFlow · Check-in tại phòng tập': 'GymFlow · Gym check-in',
  'Mã mới sau {n} giây': 'New code in {n}s',
  'Đang đổi mã…': 'Changing code…',
  'Mở camera điện thoại, quét mã QR trên màn hình này': 'Open your phone camera and scan the QR code on this screen',
  'Hoặc vào GymFlow › Check-in rồi nhập 6 số đang hiện': 'Or open GymFlow › Check-in and type the 6 digits shown',
  'Mỗi mã chỉ một người dùng và đổi mỗi 30 giây – phải có mặt ở quầy mới check-in được.': 'Each code works for one person only and changes every 30 seconds – you have to be at the front desk to check in.',
  'Tự quét mã': 'Self scan',
  'Huỷ lượt check-in': 'Undo check-in',
  'Mở màn hình mã cho hội viên': 'Open code screen for members',
  'Quét thẻ hội viên hoặc gõ mã HV / số điện thoại. Hội viên tự check-in bằng mã động trên màn hình quầy – mã đổi mỗi 30 giây nên không gửi cho người ở nhà được.':
    'Scan the member card or type the member code / phone number. Members can also check themselves in with the live code on the front-desk screen – it changes every 30 seconds, so it cannot be sent to someone at home.',
  'Đặt một máy tính bảng / TV ở quầy, đăng nhập quản lý, bấm "Mở màn hình mã cho hội viên" (hoặc mở đường dẫn /admin/checkin?screen=1).':
    'Put a tablet / TV at the front desk, sign in as manager and press "Open code screen for members" (or open /admin/checkin?screen=1).',
  'Hội viên tới nơi quét QR hoặc nhập 6 số đang hiện. Mỗi mã chỉ một người dùng, dùng xong màn hình đổi mã mới ngay; để yên thì 30 giây đổi một lần.':
    'Arriving members scan the QR or type the 6 digits shown. Each code works once: after it is used the screen shows a new one right away; otherwise it changes every 30 seconds.',
  'Ảnh chụp mã gửi cho bạn ở nhà sẽ hết hạn hoặc đã bị dùng, nên check-in "từ nhà" không được tính.':
    'A photo of the code sent to a friend at home will have expired or already been used, so "checking in from home" does not work.',
  'Lượt tự quét mã được tô xanh trong danh sách: thấy tên người không có mặt thì bấm huỷ lượt.':
    'Self check-ins are marked green in the list: if you see the name of someone who is not here, undo that check-in.',
  'Mã động cho hội viên tự check-in': 'Live code for member self check-in',
  'Tự quét mã hôm nay': 'Self check-ins today',
  'Tự cập nhật': 'Auto-refresh',
  'Lượt mới sẽ hiện ở đây ngay khi quét thẻ hoặc hội viên tự quét mã trên màn hình quầy.': 'New check-ins appear here as soon as a card is scanned or a member scans the code on the front-desk screen.',
  'Màn hình mã check-in cho hội viên': 'Member check-in code screen',
  'Lượt check-in lúc {time} của {name} sẽ bị xoá (bấm nhầm, hoặc người này không có mặt ở phòng tập).': 'The {time} check-in of {name} will be deleted (pressed by mistake, or this person is not at the gym).',
  'Check-in tại phòng tập': 'Gym check-in',
  'Quét mã QR đang hiện trên màn hình ở quầy (mã đổi mỗi 30 giây), nhập 6 số, hoặc đưa thẻ hội viên cho lễ tân quét.':
    'Scan the QR code on the front-desk screen (it changes every 30 seconds), type the 6 digits, or show your member card to the receptionist.',
  'Quay lại': 'Back',
  'Quét lại mã mới': 'Scan the new code',
  'Trên iPhone: mở app Camera, hướng vào mã QR trên màn hình quầy rồi bấm vào đường dẫn hiện ra. Hoặc nhập 6 số đang hiện:':
    'On iPhone: open the Camera app, point it at the QR code on the front-desk screen and tap the link. Or type the 6 digits shown:',
  'Mã 6 số trên màn hình quầy': '6-digit code on the front-desk screen',
  'Check-in chỉ tính khi bạn có mặt ở phòng tập: mỗi mã chỉ một người dùng và đổi mỗi 30 giây, ảnh chụp mã gửi qua tin nhắn sẽ không dùng được. Cần có gói tập còn hiệu lực hôm nay.':
    'Check-in only counts when you are at the gym: each code works for one person and changes every 30 seconds, so a photo of the code sent by message will not work. You need a plan that is valid today.',
  'Mở màn hình mã cho hội viên tự check-in': 'Open the self check-in code screen',
  'Mã này vừa có người dùng. Mỗi mã chỉ dùng một lần – quét mã mới đang hiện trên màn hình quầy':
    'This code was just used. Each code works once – scan the new code on the front-desk screen',
  'Mã không đúng hoặc đã hết hạn. Quét mã đang hiện trên màn hình ở quầy (đổi mỗi 30 giây), hoặc đưa thẻ hội viên cho lễ tân quét':
    'Wrong or expired code. Scan the code currently on the front-desk screen (it changes every 30 seconds), or show your member card to the receptionist',
};
