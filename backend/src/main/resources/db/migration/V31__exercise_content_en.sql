-- V31__exercise_content_en.sql
-- Bổ sung bản tiếng Anh cho nội dung chi tiết bài tập (hướng dẫn, hít thở, lỗi sai, an toàn, liều tập).
-- Các cột để NULL khi chưa có bản dịch; giao diện EN sẽ fallback về nội dung tiếng Việt.

ALTER TABLE exercises ADD COLUMN instructions_en TEXT NULL AFTER instructions;
ALTER TABLE exercises ADD COLUMN steps_en TEXT NULL AFTER steps;
ALTER TABLE exercises ADD COLUMN setup_position_en TEXT NULL AFTER setup_position;
ALTER TABLE exercises ADD COLUMN breathing_en VARCHAR(500) NULL AFTER breathing;
ALTER TABLE exercises ADD COLUMN common_mistakes_en TEXT NULL AFTER common_mistakes;
ALTER TABLE exercises ADD COLUMN safety_notes_en TEXT NULL AFTER safety_notes;
ALTER TABLE exercises ADD COLUMN variations_en TEXT NULL AFTER variations;
ALTER TABLE exercises ADD COLUMN suggested_dose_en VARCHAR(255) NULL AFTER suggested_dose;
ALTER TABLE exercises ADD COLUMN sets_reps_hint_en VARCHAR(100) NULL AFTER sets_reps_hint;

-- 2. Bản dịch nội dung chi tiết cho 164 bài tập (instructions_en dùng chung nội dung với steps_en)

UPDATE exercises SET
    instructions_en = '1. Lie on your back on the bench with your eyes just below the bar and both feet set firmly on the floor.
2. Grip slightly wider than shoulder width, squeeze your shoulder blades back and down.
3. Unrack the bar, lower it slowly to mid-chest, keeping your elbows angled down rather than flared out.
4. Press the bar up until your arms are almost straight; do not lock out your elbows.',
    steps_en = '1. Lie on your back on the bench with your eyes just below the bar and both feet set firmly on the floor.
2. Grip slightly wider than shoulder width, squeeze your shoulder blades back and down.
3. Unrack the bar, lower it slowly to mid-chest, keeping your elbows angled down rather than flared out.
4. Press the bar up until your arms are almost straight; do not lock out your elbows.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower the bar, exhale as you press up.',
    common_mistakes_en = 'Bouncing the bar off your chest; lifting your hips off the bench; flaring elbows perpendicular to your torso; letting your shoulder blades go slack.',
    safety_notes_en = 'Always have a spotter or use safety bars when lifting heavy. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 1;

UPDATE exercises SET
    instructions_en = '1. Set the bench to a moderate incline, sit back against the pad with a dumbbell on each thigh.
2. Bring the dumbbells to chest level as you lie back, palms facing your feet.
3. Press the dumbbells up over your chest, bringing them slightly together at the top.
4. Lower slowly to upper-chest level, keeping your shoulder blades pressed into the bench.',
    steps_en = '1. Set the bench to a moderate incline, sit back against the pad with a dumbbell on each thigh.
2. Bring the dumbbells to chest level as you lie back, palms facing your feet.
3. Press the dumbbells up over your chest, bringing them slightly together at the top.
4. Lower slowly to upper-chest level, keeping your shoulder blades pressed into the bench.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you press.',
    common_mistakes_en = 'Setting the incline too steep so the exercise shifts to the shoulders; lowering too deep before the shoulders are mobile enough; clanging the dumbbells together at the top.',
    safety_notes_en = 'End the set by bringing the dumbbells to your thighs before sitting up; do not drop them out to the sides. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 2;

UPDATE exercises SET
    instructions_en = '1. Place your hands on the floor slightly wider than shoulder width, extend your legs, and hold your body in a straight line from head to heels.
2. Brace your abs and glutes, lower your chest close to the floor, elbows angled back.
3. Push the floor away to return to the start, keeping your body straight throughout.',
    steps_en = '1. Place your hands on the floor slightly wider than shoulder width, extend your legs, and hold your body in a straight line from head to heels.
2. Brace your abs and glutes, lower your chest close to the floor, elbows angled back.
3. Push the floor away to return to the start, keeping your body straight throughout.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you push up.',
    common_mistakes_en = 'Sagging the lower back or hiking the hips; dropping the head; only lowering through half the range.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 3;

UPDATE exercises SET
    instructions_en = '1. Set the pulley at shoulder height or higher, grab the handles, and step forward one step so the cables are taut.
2. Slightly bend your elbows and keep that angle fixed.
3. Bring your hands together in an arc in front of your chest, squeezing your chest at the end.
4. Open your arms slowly back to the start until you feel a moderate stretch in your chest.',
    steps_en = '1. Set the pulley at shoulder height or higher, grab the handles, and step forward one step so the cables are taut.
2. Slightly bend your elbows and keep that angle fixed.
3. Bring your hands together in an arc in front of your chest, squeezing your chest at the end.
4. Open your arms slowly back to the start until you feel a moderate stretch in your chest.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you bring your hands together, inhale as you open.',
    common_mistakes_en = 'Bending and extending the elbows so it turns into a press; opening too wide and overstretching the shoulders; using momentum.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 4;

UPDATE exercises SET
    instructions_en = '1. Stand with feet hip-width apart, the bar over mid-foot and close to your shins.
2. Hinge at the hips, grip the bar just outside your shins, and lower your hips until your back is flat and your chest is open.
3. Brace your abs and pull the bar up close to your body by pushing the floor away and driving your hips forward.
4. Stand tall at the top without leaning back; lower the bar along the same path, pushing your hips back first before bending your knees.',
    steps_en = '1. Stand with feet hip-width apart, the bar over mid-foot and close to your shins.
2. Hinge at the hips, grip the bar just outside your shins, and lower your hips until your back is flat and your chest is open.
3. Brace your abs and pull the bar up close to your body by pushing the floor away and driving your hips forward.
4. Stand tall at the top without leaning back; lower the bar along the same path, pushing your hips back first before bending your knees.',
    setup_position_en = NULL,
    breathing_en = 'Take a deep breath and brace before you pull; exhale once you are standing tall or after you lower the bar.',
    common_mistakes_en = 'Rounding the lower back; letting the bar drift away from the body; jerking the bar off the floor; leaning back too far at the top.',
    safety_notes_en = 'This lift has complex technique: learn it with a trainer and start with light weight. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 5;

UPDATE exercises SET
    instructions_en = '1. Adjust the pad so it fits snugly over your thighs, and grip the bar wider than shoulder width.
2. Sit tall, lean back slightly, and open your chest.
3. Pull the bar down to your upper chest by driving your elbows down and back.
4. Return the bar slowly until your arms are almost straight.',
    steps_en = '1. Adjust the pad so it fits snugly over your thighs, and grip the bar wider than shoulder width.
2. Sit tall, lean back slightly, and open your chest.
3. Pull the bar down to your upper chest by driving your elbows down and back.
4. Return the bar slowly until your arms are almost straight.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull down, inhale as you return.',
    common_mistakes_en = 'Pulling the bar behind your neck; leaning back too much and using your lower back; shrugging your shoulders up to your ears.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 6;

UPDATE exercises SET
    instructions_en = '1. Sit on the bench with your feet on the platform, knees slightly bent, and grab the handle.
2. Sit tall with your chest open.
3. Pull the handle toward your stomach, squeezing your shoulder blades back.
4. Extend your arms forward under control; do not let the cable pull you into a rounded position.',
    steps_en = '1. Sit on the bench with your feet on the platform, knees slightly bent, and grab the handle.
2. Sit tall with your chest open.
3. Pull the handle toward your stomach, squeezing your shoulder blades back.
4. Extend your arms forward under control; do not let the cable pull you into a rounded position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull, inhale as you extend your arms.',
    common_mistakes_en = 'Rocking your torso for momentum; shrugging your shoulders; rounding your back as you extend your arms.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 7;

UPDATE exercises SET
    instructions_en = '1. Grip the bar wider than shoulder width with palms facing forward, and hang with your arms straight.
2. Brace your abs and pull your shoulder blades down before bending your arms.
3. Pull yourself up until your chin clears the bar.
4. Lower yourself slowly back to the hanging position.',
    steps_en = '1. Grip the bar wider than shoulder width with palms facing forward, and hang with your arms straight.
2. Brace your abs and pull your shoulder blades down before bending your arms.
3. Pull yourself up until your chin clears the bar.
4. Lower yourself slowly back to the hanging position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull up, inhale as you lower.',
    common_mistakes_en = 'Swinging your body for momentum; only pulling through half the range; dropping quickly on the way down.',
    safety_notes_en = 'Check that the bar is secure before training. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 8;

UPDATE exercises SET
    instructions_en = '1. Place the bar on your upper traps, grip it firmly, step back out of the rack, and set your feet about shoulder-width apart.
2. Take a deep breath, brace your abs, push your hips back, and bend your knees at the same time.
3. Lower to the depth where you can still keep your back flat, with your knees tracking over your toes.
4. Drive through your whole foot into the floor to stand up.',
    steps_en = '1. Place the bar on your upper traps, grip it firmly, step back out of the rack, and set your feet about shoulder-width apart.
2. Take a deep breath, brace your abs, push your hips back, and bend your knees at the same time.
3. Lower to the depth where you can still keep your back flat, with your knees tracking over your toes.
4. Drive through your whole foot into the floor to stand up.',
    setup_position_en = NULL,
    breathing_en = 'Inhale and hold as you descend, exhale once you are past the hardest point on the way up.',
    common_mistakes_en = 'Knees caving inward; lifting your heels; rounding your back at the bottom; placing the bar on your neck.',
    safety_notes_en = 'Set the safety bars in the squat rack at the right height. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 9;

UPDATE exercises SET
    instructions_en = '1. Sit with your back against the pad and place both feet on the platform hip-width apart.
2. Release the safety catches and lower the platform slowly by bending your knees.
3. Stop before your hips start rolling off the pad.
4. Press up until your legs are almost straight; do not lock your knees.',
    steps_en = '1. Sit with your back against the pad and place both feet on the platform hip-width apart.
2. Release the safety catches and lower the platform slowly by bending your knees.
3. Stop before your hips start rolling off the pad.
4. Press up until your legs are almost straight; do not lock your knees.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you press.',
    common_mistakes_en = 'Locking your knees at the top; going so deep that your lower back lifts off the pad; pushing your knees with your hands.',
    safety_notes_en = 'Always re-engage the safety catches at the end of the set. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 10;

UPDATE exercises SET
    instructions_en = '1. Stand tall holding the bar in front of your thighs, knees slightly bent.
2. Push your hips back and let the bar slide down close to your thighs just below the knees, keeping your back flat.
3. Stop when your hamstrings are stretched and your back is about to lose its flat position.
4. Drive your hips forward to stand up, squeezing your glutes at the top.',
    steps_en = '1. Stand tall holding the bar in front of your thighs, knees slightly bent.
2. Push your hips back and let the bar slide down close to your thighs just below the knees, keeping your back flat.
3. Stop when your hamstrings are stretched and your back is about to lose its flat position.
4. Drive your hips forward to stand up, squeezing your glutes at the top.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you stand up.',
    common_mistakes_en = 'Rounding your back instead of hinging at the hips; bending your knees as much as in a squat; letting the bar drift away from your legs.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 11;

UPDATE exercises SET
    instructions_en = '1. Stand tall holding dumbbells at your sides (or no weight when starting out).
2. Step one foot forward and lower until both knees are bent to about 90 degrees.
3. Drive through the front foot to stand up, then step the back foot through to the front.
4. Keep alternating legs with each step.',
    steps_en = '1. Stand tall holding dumbbells at your sides (or no weight when starting out).
2. Step one foot forward and lower until both knees are bent to about 90 degrees.
3. Drive through the front foot to stand up, then step the back foot through to the front.
4. Keep alternating legs with each step.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you stand up.',
    common_mistakes_en = 'Taking too short a step so the front knee drifts forward; knees caving inward; leaning your torso forward.',
    safety_notes_en = 'You need clear space in front of you with no obstacles. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 12;

UPDATE exercises SET
    instructions_en = '1. Set the bar at front-shoulder height, grip slightly wider than shoulder width, elbows slightly in front.
2. Brace your abs and glutes so your torso does not lean back.
3. Press the bar straight up, move your head slightly back so the bar passes, then bring your head back in line.
4. Lower the bar under control back to your shoulders.',
    steps_en = '1. Set the bar at front-shoulder height, grip slightly wider than shoulder width, elbows slightly in front.
2. Brace your abs and glutes so your torso does not lean back.
3. Press the bar straight up, move your head slightly back so the bar passes, then bring your head back in line.
4. Lower the bar under control back to your shoulders.',
    setup_position_en = NULL,
    breathing_en = 'Inhale and brace before you press, exhale as the bar passes overhead.',
    common_mistakes_en = 'Leaning too far back; pressing the bar around in front of your face; not bracing your core.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 13;

UPDATE exercises SET
    instructions_en = '1. Stand tall holding dumbbells at your sides, elbows slightly bent.
2. Raise both arms out to the sides to about shoulder height.
3. Pause briefly, then lower slowly back to the start.',
    steps_en = '1. Stand tall holding dumbbells at your sides, elbows slightly bent.
2. Raise both arms out to the sides to about shoulder height.
3. Pause briefly, then lower slowly back to the start.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you raise, inhale as you lower.',
    common_mistakes_en = 'Using too much weight and swinging your body; shrugging your shoulders; raising above shoulder height.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 14;

UPDATE exercises SET
    instructions_en = '1. Set the pulley at face height, attach the rope, and grab both ends.
2. Step back so the cable is taut and set your stance.
3. Pull the rope toward your face, splitting your hands to the sides with elbows at or above shoulder height.
4. Return slowly.',
    steps_en = '1. Set the pulley at face height, attach the rope, and grab both ends.
2. Step back so the cable is taut and set your stance.
3. Pull the rope toward your face, splitting your hands to the sides with elbows at or above shoulder height.
4. Return slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull, inhale as you return.',
    common_mistakes_en = 'Leaning back; using too much weight; letting your elbows drop.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 15;

UPDATE exercises SET
    instructions_en = '1. Stand tall with an underhand grip at shoulder width, arms extended in front of your thighs.
2. Keep your elbows close to your body and curl the bar up to shoulder level.
3. Lower slowly back to the start.',
    steps_en = '1. Stand tall with an underhand grip at shoulder width, arms extended in front of your thighs.
2. Keep your elbows close to your body and curl the bar up to shoulder level.
3. Lower slowly back to the start.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl up, inhale as you lower.',
    common_mistakes_en = 'Swinging your torso; elbows drifting forward; letting the bar drop on the way down.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 16;

UPDATE exercises SET
    instructions_en = '1. Set the pulley high, grab the bar or rope, and keep your elbows close to your body.
2. Extend your arms and push down until your arms are straight.
3. Return slowly until your forearms are close to horizontal, keeping your elbows still.',
    steps_en = '1. Set the pulley high, grab the bar or rope, and keep your elbows close to your body.
2. Extend your arms and push down until your arms are straight.
3. Return slowly until your forearms are close to horizontal, keeping your elbows still.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you push down, inhale as you return.',
    common_mistakes_en = 'Elbows drifting forward or flaring out; leaning over and pressing your weight down on the stack.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 17;

UPDATE exercises SET
    instructions_en = '1. Rest your forearms on the mat with your elbows directly under your shoulders.
2. Extend your legs and lift your body so your head, hips, and heels form a straight line.
3. Brace your abs and glutes and hold the position for the time your trainer sets.',
    steps_en = '1. Rest your forearms on the mat with your elbows directly under your shoulders.
2. Extend your legs and lift your body so your head, hips, and heels form a straight line.
3. Brace your abs and glutes and hold the position for the time your trainer sets.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily; do not hold your breath.',
    common_mistakes_en = 'Sagging hips; hips too high; holding your breath.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 18;

UPDATE exercises SET
    instructions_en = '1. Hang from the bar with your arms straight and your shoulders gently pulled down.
2. Raise your legs in front of you (bend your knees when starting out) and curl your pelvis slightly up.
3. Lower your legs slowly without swinging.',
    steps_en = '1. Hang from the bar with your arms straight and your shoulders gently pulled down.
2. Raise your legs in front of you (bend your knees when starting out) and curl your pelvis slightly up.
3. Lower your legs slowly without swinging.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you raise your legs, inhale as you lower.',
    common_mistakes_en = 'Swinging for momentum; using only the hip flexors without curling the pelvis.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps, and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 19;

UPDATE exercises SET
    instructions_en = '1. Stand with both feet on the side rails of the machine and clip the emergency stop cord (if present) to your shirt.
2. Start the machine at a slow speed, step onto the belt, and walk to warm up.
3. Increase the speed gradually to a comfortable running pace.
4. Slow down gradually to a walking recovery before stopping the machine.',
    steps_en = '1. Stand with both feet on the side rails of the machine and clip the emergency stop cord (if present) to your shirt.
2. Start the machine at a slow speed, step onto the belt, and walk to warm up.
3. Increase the speed gradually to a comfortable running pace.
4. Slow down gradually to a walking recovery before stopping the machine.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily to the rhythm of your steps. Moderate intensity: you can still talk but cannot sing; vigorous intensity: you cannot say more than a few words without pausing for breath.',
    common_mistakes_en = 'Holding the handrails the whole time while running; overstriding and landing on your heel far in front; jumping off while the belt is still moving.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or every day.',
    sets_reps_hint_en = NULL
WHERE id = 20;

UPDATE exercises SET
    instructions_en = '1. Adjust the seat so your knee stays slightly bent when the pedal is at its lowest point.
2. Sit upright with your hands resting lightly on the handlebars.
3. Pedal steadily for a few minutes at an easy level to warm up, then increase resistance gradually.
4. Lower the resistance for the last few minutes to recover.',
    steps_en = '1. Adjust the seat so your knee stays slightly bent when the pedal is at its lowest point.
2. Sit upright with your hands resting lightly on the handlebars.
3. Pedal steadily for a few minutes at an easy level to warm up, then increase resistance gradually.
4. Lower the resistance for the last few minutes to recover.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily. If you can talk but not sing, you are at moderate intensity.',
    common_mistakes_en = 'Seat too low so the knee bends too much; putting weight on your hands; resistance too light so the pedals spin freely.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or every day.',
    sets_reps_hint_en = NULL
WHERE id = 21;

UPDATE exercises SET
    instructions_en = '1. Stand tall, squat down and place both hands on the floor.
2. Jump or step both feet back into a push-up position.
3. (Optional) do one push-up.
4. Bring your feet back near your hands, stand up and jump lightly.',
    steps_en = '1. Stand tall, squat down and place both hands on the floor.
2. Jump or step both feet back into a push-up position.
3. (Optional) do one push-up.
4. Bring your feet back near your hands, stand up and jump lightly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you jump up; don''t hold your breath.',
    common_mistakes_en = 'Arching your lower back in the push-up position; landing with stiff knees; going so fast that your form breaks down.',
    safety_notes_en = 'High-intensity, high-impact move: beginners should skip the jump. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or every day.',
    sets_reps_hint_en = NULL
WHERE id = 22;

UPDATE exercises SET
    instructions_en = '1. Stand with feet wider than hip-width, weight on the floor in front of you.
2. Hinge at the hips, grip the weight with both hands and swing it back between your thighs.
3. Drive your hips forward hard so the weight swings up to about chest height.
4. Let the weight fall back between your thighs while hinging at the hips, and repeat continuously.',
    steps_en = '1. Stand with feet wider than hip-width, weight on the floor in front of you.
2. Hinge at the hips, grip the weight with both hands and swing it back between your thighs.
3. Drive your hips forward hard so the weight swings up to about chest height.
4. Let the weight fall back between your thighs while hinging at the hips, and repeat continuously.',
    setup_position_en = NULL,
    breathing_en = 'Exhale forcefully as you drive your hips forward, inhale as the weight comes down.',
    common_mistakes_en = 'Squatting instead of hinging at the hips; lifting the weight with your arms; rounding your back as the weight swings back.',
    safety_notes_en = 'Make sure no one is standing in front of or behind you within the swing path. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where you need a short rest before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 23;

UPDATE exercises SET
    instructions_en = '1. Sit at the edge of the chair, feet hip-width apart, torso leaning slightly forward.
2. Stand up slowly using your leg strength, without pushing with your hands; look straight ahead, not down.
3. Stand tall, then sit down slowly, using your hands only for guidance if needed.',
    steps_en = '1. Sit at the edge of the chair, feet hip-width apart, torso leaning slightly forward.
2. Stand up slowly using your leg strength, without pushing with your hands; look straight ahead, not down.
3. Stand tall, then sit down slowly, using your hands only for guidance if needed.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you stand up, inhale as you sit down.',
    common_mistakes_en = 'Pushing off the chair with your hands; plopping down; looking down at the floor.',
    safety_notes_en = 'Choose a sturdy chair with no wheels that won''t slide on the floor. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Start with about 5 reps, as slowly as possible; increase the number gradually over time. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 24;

UPDATE exercises SET
    instructions_en = '1. Stand behind a chair, place both hands on the chair back, feet hip-width apart.
2. Bend your knees slowly within a comfortable range, knees tracking forward over your big toes; keep your back straight.
3. Rise slowly and squeeze your glutes as you stand.',
    steps_en = '1. Stand behind a chair, place both hands on the chair back, feet hip-width apart.
2. Bend your knees slowly within a comfortable range, knees tracking forward over your big toes; keep your back straight.
3. Rise slowly and squeeze your glutes as you stand.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you bend your knees, exhale as you stand up.',
    common_mistakes_en = 'Knees caving inward; rounding your back; going too deep for your ability.',
    safety_notes_en = 'Choose a sturdy chair that won''t slide. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Start with 5 reps; increase the number gradually over time. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 25;

UPDATE exercises SET
    instructions_en = '1. Stand behind a chair, hands on the chair back for support.
2. Lift both heels as high as comfortable, slowly and under control.
3. Lower your heels slowly.',
    steps_en = '1. Stand behind a chair, hands on the chair back for support.
2. Lift both heels as high as comfortable, slowly and under control.
3. Lower your heels slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you rise onto your toes, inhale as you lower.',
    common_mistakes_en = 'Bouncing for momentum; leaning your body forward.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Start with 5 reps; increase gradually over time. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 26;

UPDATE exercises SET
    instructions_en = '1. Stand behind a chair, holding the chair back.
2. Lift your right leg out to the side within a comfortable range, keeping your back and hips straight and without leaning to the right.
3. Lower it and switch to the left leg.',
    steps_en = '1. Stand behind a chair, holding the chair back.
2. Lift your right leg out to the side within a comfortable range, keeping your back and hips straight and without leaning to the right.
3. Lower it and switch to the left leg.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you lift your leg, inhale as you lower.',
    common_mistakes_en = 'Leaning your torso to the side; turning your toes up; swinging your leg quickly.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Lift and lower 5 times per leg. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 27;

UPDATE exercises SET
    instructions_en = '1. Stand tall behind a chair, holding the chair back.
2. Extend your left leg straight back without arching your lower back; focus the effort in your hamstrings and glutes.
3. Lower it and switch to the right leg.',
    steps_en = '1. Stand tall behind a chair, holding the chair back.
2. Extend your left leg straight back without arching your lower back; focus the effort in your hamstrings and glutes.
3. Lower it and switch to the right leg.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you extend your leg back, inhale as you lower.',
    common_mistakes_en = 'Arching your back to lift the leg higher; bending the knee of the lifting leg.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Hold at the top for about 5 seconds; 5 reps per leg. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 28;

UPDATE exercises SET
    instructions_en = '1. Stand an arm''s length from the wall, place your palms flat on the wall at chest height with fingers pointing up.
2. Keep your back straight, bend your arms slowly with your elbows close to your body, and bring your body as close to the wall as you can.
3. Push slowly back to the starting position.',
    steps_en = '1. Stand an arm''s length from the wall, place your palms flat on the wall at chest height with fingers pointing up.
2. Keep your back straight, bend your arms slowly with your elbows close to your body, and bring your body as close to the wall as you can.
3. Push slowly back to the starting position.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you move toward the wall, exhale as you push away.',
    common_mistakes_en = 'Arching your back; flaring your elbows; going too fast.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Try 3 sets of 5–10 reps. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 29;

UPDATE exercises SET
    instructions_en = '1. Hold a light weight in each hand (a full water bottle works too), stand with feet hip-width apart.
2. Keep your upper arms close to your body and curl slowly until the weights come near your shoulders.
3. Lower slowly. You can also do this seated.',
    steps_en = '1. Hold a light weight in each hand (a full water bottle works too), stand with feet hip-width apart.
2. Keep your upper arms close to your body and curl slowly until the weights come near your shoulders.
3. Lower slowly. You can also do this seated.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl up, inhale as you lower.',
    common_mistakes_en = 'Swinging your torso; elbows drifting away from your body.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Try 3 sets of 5 reps per arm. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 30;

UPDATE exercises SET
    instructions_en = '1. Stand with feet together, knees slightly bent.
2. Step one foot out to the side slowly and under control.
3. Bring the other foot in to meet it. Don''t let your hips drop as you step.',
    steps_en = '1. Stand with feet together, knees slightly bent.
2. Step one foot out to the side slowly and under control.
3. Bring the other foot in to meet it. Don''t let your hips drop as you step.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily.',
    common_mistakes_en = 'Rushing the steps; letting your hips drop; looking down at your feet.',
    safety_notes_en = 'Train near a wall or sturdy chair to hold onto if you lose your balance. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = '10 steps in each direction, or walk the full length of the room sideways. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 31;

UPDATE exercises SET
    instructions_en = '1. Stand tall and place your right heel directly in front of your left toes.
2. Do the same with your left heel. Always look straight ahead.
3. If needed, rest your fingertips on the wall; move away from the wall as you improve.',
    steps_en = '1. Stand tall and place your right heel directly in front of your left toes.
2. Do the same with your left heel. Always look straight ahead.
3. If needed, rest your fingertips on the wall; move away from the wall as you improve.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily.',
    common_mistakes_en = 'Looking down at your feet; stepping with feet too far apart.',
    safety_notes_en = 'Train near a wall or sturdy chair to hold onto if you lose your balance. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'At least 5 steps. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 32;

UPDATE exercises SET
    instructions_en = '1. Stand facing the wall, extend your arms and touch the wall with your fingertips.
2. Lift your left foot, keep your hips level and your standing leg slightly bent at the knee.
3. Set your foot down gently, then switch sides.',
    steps_en = '1. Stand facing the wall, extend your arms and touch the wall with your fingertips.
2. Lift your left foot, keep your hips level and your standing leg slightly bent at the knee.
3. Set your foot down gently, then switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily; don''t hold your breath.',
    common_mistakes_en = 'Locking the standing knee; tilting your hips.',
    safety_notes_en = 'Train near a wall or sturdy chair to hold onto if you lose your balance. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Hold 5–10 seconds, 3 times per side. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 33;

UPDATE exercises SET
    instructions_en = '1. Step your right foot up onto the step.
2. Bring your left foot up to stand beside it.
3. Step down and return to the start. Go up and down slowly and under control.',
    steps_en = '1. Step your right foot up onto the step.
2. Bring your left foot up to stand beside it.
3. Step down and return to the start. Go up and down slowly and under control.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you step up, inhale as you step down.',
    common_mistakes_en = 'Rushing the steps; pushing off with the lower foot instead of the foot on the step.',
    safety_notes_en = 'Use a step with a handrail or next to a wall. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Up to 5 steps per leg. Train at least 2 times/week.',
    sets_reps_hint_en = NULL
WHERE id = 34;

UPDATE exercises SET
    instructions_en = '1. Place both hands on the wall for support.
2. Bend your right leg, step your left foot back and keep it straight; both feet flat on the floor.
3. Keep your left heel on the floor and your left leg as straight as possible to stretch your left calf.
4. Switch legs.',
    steps_en = '1. Place both hands on the wall for support.
2. Bend your right leg, step your left foot back and keep it straight; both feet flat on the floor.
3. Keep your left heel on the floor and your left leg as straight as possible to stretch your left calf.
4. Switch legs.',
    setup_position_en = NULL,
    breathing_en = 'Breathe slowly and evenly during the hold.',
    common_mistakes_en = 'Lifting the back heel; bouncing during the stretch.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = '3 times per side. For post-workout stretching, hold 15–20 seconds.',
    sets_reps_hint_en = NULL
WHERE id = 35;

UPDATE exercises SET
    instructions_en = '1. Lie on your back and lift your right leg.
2. Clasp your right leg with both hands under the knee.
3. Keep your left leg bent with the foot on the floor; pull your right leg toward you, keeping it straight.
4. Switch legs.',
    steps_en = '1. Lie on your back and lift your right leg.
2. Clasp your right leg with both hands under the knee.
3. Keep your left leg bent with the foot on the floor; pull your right leg toward you, keeping it straight.
4. Switch legs.',
    setup_position_en = NULL,
    breathing_en = 'Breathe slowly and evenly during the hold.',
    common_mistakes_en = 'Yanking the leg; holding at the knee joint instead of under the knee.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Hold 15–20 seconds per side.',
    sets_reps_hint_en = NULL
WHERE id = 36;

UPDATE exercises SET
    instructions_en = '1. Sit tall without leaning on the chair back; pull your shoulders back and down and open your arms out to the sides.
2. Gently push your chest forward and up until you feel a stretch across your chest.',
    steps_en = '1. Sit tall without leaning on the chair back; pull your shoulders back and down and open your arms out to the sides.
2. Gently push your chest forward and up until you feel a stretch across your chest.',
    setup_position_en = NULL,
    breathing_en = 'Breathe slowly and evenly during the hold.',
    common_mistakes_en = 'Shrugging your shoulders; arching your lower back too much.',
    safety_notes_en = 'Choose a sturdy chair with no wheels and no armrests. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Hold 5–10 seconds, repeat 5 times.',
    sets_reps_hint_en = NULL
WHERE id = 37;

UPDATE exercises SET
    instructions_en = '1. Sit tall with your feet flat on the floor, arms crossed touching your shoulders.
2. Keep your hips still and rotate your upper body to the left within a comfortable range, hold 5 seconds.
3. Repeat on the right side.',
    steps_en = '1. Sit tall with your feet flat on the floor, arms crossed touching your shoulders.
2. Keep your hips still and rotate your upper body to the left within a comfortable range, hold 5 seconds.
3. Repeat on the right side.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you rotate, inhale as you return to center.',
    common_mistakes_en = 'Rotating your hips too; jerking past a comfortable range.',
    safety_notes_en = 'Choose a sturdy chair with no wheels and no armrests. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = '5 times per side.',
    sets_reps_hint_en = NULL
WHERE id = 38;

UPDATE exercises SET
    instructions_en = '1. Sit tall without leaning on the chair back, grip both sides of the chair.
2. Lift your left leg with the knee bent, as high as comfortable; lower it under control.
3. Repeat with the right leg.',
    steps_en = '1. Sit tall without leaning on the chair back, grip both sides of the chair.
2. Lift your left leg with the knee bent, as high as comfortable; lower it under control.
3. Repeat with the right leg.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily.',
    common_mistakes_en = 'Leaning back to lift the leg; letting the leg drop.',
    safety_notes_en = 'Choose a sturdy chair with no wheels and no armrests. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = '5 reps per leg.',
    sets_reps_hint_en = NULL
WHERE id = 39;

UPDATE exercises SET
    instructions_en = '1. Wear comfortable shoes with good support that don''t cause blisters.
2. Walk faster than a stroll: you can still talk but not sing.
3. If you haven''t been active for a while, increase the distance gradually.
4. Fit it into daily life: walk part of your commute, take the stairs instead of the elevator.',
    steps_en = '1. Wear comfortable shoes with good support that don''t cause blisters.
2. Walk faster than a stroll: you can still talk but not sing.
3. If you haven''t been active for a while, increase the distance gradually.
4. Fit it into daily life: walk part of your commute, take the stairs instead of the elevator.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily in rhythm with your steps.',
    common_mistakes_en = 'Walking too slowly (turning it into a stroll); increasing the distance too quickly.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or feel unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Just 10 minutes of brisk walking a day counts toward the 150 minutes/week target for adults 19–64.',
    sets_reps_hint_en = NULL
WHERE id = 40;

UPDATE exercises SET
    instructions_en = '1. Sit tall, shoulders down, eyes looking straight ahead.
2. Slowly turn your head toward your left shoulder within a comfortable range, hold for 5 seconds, then return to center.
3. Repeat on the right side.',
    steps_en = '1. Sit tall, shoulders down, eyes looking straight ahead.
2. Slowly turn your head toward your left shoulder within a comfortable range, hold for 5 seconds, then return to center.
3. Repeat on the right side.',
    setup_position_en = NULL,
    breathing_en = 'Breathe slowly and evenly while holding.',
    common_mistakes_en = 'Jerking the head or turning past a comfortable range; shrugging the shoulders up toward the ears.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = '3 times per side.',
    sets_reps_hint_en = NULL
WHERE id = 41;

UPDATE exercises SET
    instructions_en = '1. Sit tall, look straight ahead, right hand holds the left shoulder down.
2. Slowly tilt your head to the right while the left shoulder stays down.
3. Switch sides.',
    steps_en = '1. Sit tall, look straight ahead, right hand holds the left shoulder down.
2. Slowly tilt your head to the right while the left shoulder stays down.
3. Switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Breathe slowly and evenly while holding.',
    common_mistakes_en = 'Pulling the head with your hand; letting the shoulder on the stretching side rise.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Hold 5 seconds, 3 times per side.',
    sets_reps_hint_en = NULL
WHERE id = 42;

UPDATE exercises SET
    instructions_en = '1. Stand tall with feet hip-width apart, arms at your sides.
2. Slide your left hand down along your side within a comfortable range; you should feel a stretch in the opposite hip.
3. Return to center, then repeat with the right hand.',
    steps_en = '1. Stand tall with feet hip-width apart, arms at your sides.
2. Slide your left hand down along your side within a comfortable range; you should feel a stretch in the opposite hip.
3. Return to center, then repeat with the right hand.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you lean, inhale as you return to center.',
    common_mistakes_en = 'Leaning forward or backward instead of sideways; bouncing.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Hold 2 seconds, 3 times per side.',
    sets_reps_hint_en = NULL
WHERE id = 43;

UPDATE exercises SET
    instructions_en = '1. Sit tall, hold the sides of the chair, straighten your left leg and lift your foot off the floor.
2. Keep the leg straight and point your toes away.
3. Pull your toes back toward you.
4. Switch legs.',
    steps_en = '1. Sit tall, hold the sides of the chair, straighten your left leg and lift your foot off the floor.
2. Keep the leg straight and point your toes away.
3. Pull your toes back toward you.
4. Switch legs.',
    setup_position_en = NULL,
    breathing_en = 'Breathe evenly.',
    common_mistakes_en = 'Bending the knee of the lifted leg; moving fast or jerking the ankle.',
    safety_notes_en = 'Choose a sturdy chair with no wheels and no armrests. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'Try 2 sets of 5 reps per leg.',
    sets_reps_hint_en = NULL
WHERE id = 44;

UPDATE exercises SET
    instructions_en = '1. Stand about one foot-length from the wall with your back against it, knees hip-width apart, toes slightly turned out.
2. Slowly bend your knees so your back slides down the wall; knees do not pass your toes and stay in line with them.
3. As you stand up, actively squeeze the muscles above the knees and your glutes.',
    steps_en = '1. Stand about one foot-length from the wall with your back against it, knees hip-width apart, toes slightly turned out.
2. Slowly bend your knees so your back slides down the wall; knees do not pass your toes and stay in line with them.
3. As you stand up, actively squeeze the muscles above the knees and your glutes.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you slide down, exhale as you stand up.',
    common_mistakes_en = 'Knees passing the toes; knees caving inward; sliding down too fast.',
    safety_notes_en = 'You should not feel pain during the exercise; if it hurts, stop immediately and see a doctor. Not suitable for people with a knee injury. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = NULL,
    sets_reps_hint_en = NULL
WHERE id = 45;

UPDATE exercises SET
    instructions_en = '1. Sit tall on a chair.
2. Slowly straighten and lift your right leg until it is straight, toes slightly turned out.
3. Squeeze your right thigh and hold for 5 seconds; keep the muscle above the knee engaged throughout.
4. Switch legs.',
    steps_en = '1. Sit tall on a chair.
2. Slowly straighten and lift your right leg until it is straight, toes slightly turned out.
3. Squeeze your right thigh and hold for 5 seconds; keep the muscle above the knee engaged throughout.
4. Switch legs.',
    setup_position_en = NULL,
    breathing_en = 'Breathe evenly; do not hold your breath while holding.',
    common_mistakes_en = 'Relaxing the thigh muscle while holding; leaning back.',
    safety_notes_en = 'You should not feel pain during the exercise; if it hurts, stop immediately and see a doctor. Not suitable for people with a knee injury. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = '10 reps per leg, holding 5 seconds each.',
    sets_reps_hint_en = NULL
WHERE id = 46;

UPDATE exercises SET
    instructions_en = '1. Sit at the edge of the chair, bend your right leg, straighten your left leg with the left heel on the floor and toes slightly turned out.
2. Keep your back straight and hinge forward from the hips toward your left leg to stretch the hamstring while squeezing the muscle above the knee.
3. Switch legs.',
    steps_en = '1. Sit at the edge of the chair, bend your right leg, straighten your left leg with the left heel on the floor and toes slightly turned out.
2. Keep your back straight and hinge forward from the hips toward your left leg to stretch the hamstring while squeezing the muscle above the knee.
3. Switch legs.',
    setup_position_en = NULL,
    breathing_en = 'Breathe slowly and evenly while holding.',
    common_mistakes_en = 'Rounding the back to reach further; bending from the lower back instead of the hips.',
    safety_notes_en = 'You should not feel pain during the exercise; if it hurts, stop immediately and see a doctor. Not suitable for people with a knee injury. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = '3 sets, holding 15 seconds per leg each set.',
    sets_reps_hint_en = NULL
WHERE id = 47;

UPDATE exercises SET
    instructions_en = '1. Stand with feet shoulder-width apart, toes slightly turned out, arms at your sides or extended in front for balance.
2. Lower as if about to sit down on a chair, bending your knees no more than a right angle.
3. Keep your back straight and knees from passing your toes; stand back up to the starting position.',
    steps_en = '1. Stand with feet shoulder-width apart, toes slightly turned out, arms at your sides or extended in front for balance.
2. Lower as if about to sit down on a chair, bending your knees no more than a right angle.
3. Keep your back straight and knees from passing your toes; stand back up to the starting position.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you stand up.',
    common_mistakes_en = 'Bending the knees past a right angle before you are used to it; rounding the back; lifting the heels.',
    safety_notes_en = 'You should not feel pain during the exercise; if it hurts, stop immediately and see a doctor. Not suitable for people with a knee injury. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = NULL,
    sets_reps_hint_en = NULL
WHERE id = 48;

UPDATE exercises SET
    instructions_en = '1. Stand in a split stance: right foot forward, left foot back.
2. Slowly bend both knees to lower your body until the front leg is close to a right angle.
3. Put your weight in your heels and push back up to the starting position; back straight, knees not passing your toes.
4. Switch legs.',
    steps_en = '1. Stand in a split stance: right foot forward, left foot back.
2. Slowly bend both knees to lower your body until the front leg is close to a right angle.
3. Put your weight in your heels and push back up to the starting position; back straight, knees not passing your toes.
4. Switch legs.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you push up.',
    common_mistakes_en = 'Front knee passing the toes; torso leaning forward; shifting weight onto the toes.',
    safety_notes_en = 'You should not feel pain during the exercise; if it hurts, stop immediately and see a doctor. Not suitable for people with a knee injury. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = '3 sets of 5 reps per leg.',
    sets_reps_hint_en = NULL
WHERE id = 49;

UPDATE exercises SET
    instructions_en = '1. Sit at the edge of the chair, place two dumbbells on your thighs, then lie back and bring the dumbbells to chest level.
2. Plant both feet firmly on the floor and squeeze your shoulder blades back.
3. Press the dumbbells up above your chest until your arms are almost straight.
4. Lower slowly to chest level with your elbows angled about 45 degrees down from your torso.',
    steps_en = '1. Sit at the edge of the chair, place two dumbbells on your thighs, then lie back and bring the dumbbells to chest level.
2. Plant both feet firmly on the floor and squeeze your shoulder blades back.
3. Press the dumbbells up above your chest until your arms are almost straight.
4. Lower slowly to chest level with your elbows angled about 45 degrees down from your torso.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower the dumbbells, exhale as you press up.',
    common_mistakes_en = 'Letting the dumbbells drop fast on the lowering phase; flaring the elbows perpendicular to the torso; lifting the hips off the bench.',
    safety_notes_en = 'End the set by bringing the dumbbells to your thighs and sitting up; do not drop the dumbbells to the sides. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 50;

UPDATE exercises SET
    instructions_en = '1. Adjust the seat so the handles are level with the middle of your chest.
2. Sit with your back against the pad, feet flat, and grip the handles.
3. Push the handles forward until your arms are almost straight.
4. Return slowly until you feel a moderate stretch in your chest; do not let the weights touch.',
    steps_en = '1. Adjust the seat so the handles are level with the middle of your chest.
2. Sit with your back against the pad, feet flat, and grip the handles.
3. Push the handles forward until your arms are almost straight.
4. Return slowly until you feel a moderate stretch in your chest; do not let the weights touch.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you push, inhale as you return.',
    common_mistakes_en = 'Adjusting the seat too low or too high; shrugging the shoulders up toward the ears; letting the weight stack bang together between reps.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 51;

UPDATE exercises SET
    instructions_en = '1. Adjust the seat so the handles are at shoulder height, and sit with your back against the pad.
2. Slightly bend your elbows and keep this angle throughout the movement.
3. Bring your hands together in front of your chest and squeeze your chest at the end of the movement.
4. Open your arms slowly back to the starting position until you feel a moderate stretch in your chest.',
    steps_en = '1. Adjust the seat so the handles are at shoulder height, and sit with your back against the pad.
2. Slightly bend your elbows and keep this angle throughout the movement.
3. Bring your hands together in front of your chest and squeeze your chest at the end of the movement.
4. Open your arms slowly back to the starting position until you feel a moderate stretch in your chest.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you bring your arms together, inhale as you open them.',
    common_mistakes_en = 'Opening the arms too far behind the shoulders; using momentum; lifting your back off the pad.',
    safety_notes_en = 'Do not open your arms past the shoulder line if your shoulders hurt. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 52;

UPDATE exercises SET
    instructions_en = '1. Grip the bars with straight arms and shoulders pulled down away from your ears.
2. Lean your body slightly forward and bend your knees so your feet are off the floor.
3. Bend your elbows to lower until your shoulders are level with or slightly higher than your elbows.
4. Push back up to the starting position.',
    steps_en = '1. Grip the bars with straight arms and shoulders pulled down away from your ears.
2. Lean your body slightly forward and bend your knees so your feet are off the floor.
3. Bend your elbows to lower until your shoulders are level with or slightly higher than your elbows.
4. Push back up to the starting position.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you push up.',
    common_mistakes_en = 'Lowering too deep before the shoulders are mobile enough; shrugging the shoulders up toward the ears; swinging the legs for momentum.',
    safety_notes_en = 'Beginners should use an assisted machine or a resistance band. Skip this exercise if you feel pain at the front of the shoulder. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 53;

UPDATE exercises SET
    instructions_en = '1. Stand with feet hip-width apart, holding the bar slightly wider than shoulder-width.
2. Hinge at the hips and push your hips back, back straight, torso at about 45 degrees.
3. Pull the bar toward your lower abdomen and squeeze your shoulder blades together.
4. Lower the bar slowly until your arms are straight, keeping the torso angle.',
    steps_en = '1. Stand with feet hip-width apart, holding the bar slightly wider than shoulder-width.
2. Hinge at the hips and push your hips back, back straight, torso at about 45 degrees.
3. Pull the bar toward your lower abdomen and squeeze your shoulder blades together.
4. Lower the bar slowly until your arms are straight, keeping the torso angle.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull up, inhale as you lower.',
    common_mistakes_en = 'Rounding the back; gradually standing up during the pull; jerking the bar with momentum.',
    safety_notes_en = 'Keep your back straight and your core braced throughout the set; people with lower back pain should choose a one-arm dumbbell row with chest support. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 54;

UPDATE exercises SET
    instructions_en = '1. Place the knee and hand on the same side on the bench, with the other foot firmly on the floor.
2. Hold a dumbbell in the other hand, arm hanging straight below your shoulder, back parallel to the floor.
3. Pull the dumbbell toward your hip with your elbow close to your body.
4. Lower slowly until your arm is straight. Finish one side, then switch sides.',
    steps_en = '1. Place the knee and hand on the same side on the bench, with the other foot firmly on the floor.
2. Hold a dumbbell in the other hand, arm hanging straight below your shoulder, back parallel to the floor.
3. Pull the dumbbell toward your hip with your elbow close to your body.
4. Lower slowly until your arm is straight. Finish one side, then switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull, inhale as you lower.',
    common_mistakes_en = 'Rotating the torso to pull the weight up; pulling toward the chest instead of the hip; shrugging.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 55;

UPDATE exercises SET
    instructions_en = '1. Set the bar at about hip height, lie underneath it and grip slightly wider than shoulder-width.
2. Straighten your body from head to heels, heels on the floor.
3. Pull your chest up toward the bar and squeeze your shoulder blades together.
4. Lower slowly until your arms are straight, keeping your body straight.',
    steps_en = '1. Set the bar at about hip height, lie underneath it and grip slightly wider than shoulder-width.
2. Straighten your body from head to heels, heels on the floor.
3. Pull your chest up toward the bar and squeeze your shoulder blades together.
4. Lower slowly until your arms are straight, keeping your body straight.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull up, inhale as you lower.',
    common_mistakes_en = 'Sagging hips; craning the neck so the chin touches the bar; pulling through only half the range.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 56;

UPDATE exercises SET
    instructions_en = '1. Adjust the pad so its edge sits just below your hip bones, with your heels hooked on the leg pad.
2. Cross your arms over your chest and keep your body straight.
3. Hinge at the hips and lower your body within a comfortable range.
4. Squeeze your glutes to lift your body until it is in line with your legs, without over-arching.',
    steps_en = '1. Adjust the pad so its edge sits just below your hip bones, with your heels hooked on the leg pad.
2. Cross your arms over your chest and keep your body straight.
3. Hinge at the hips and lower your body within a comfortable range.
4. Squeeze your glutes to lift your body until it is in line with your legs, without over-arching.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you lift.',
    common_mistakes_en = 'Over-arching at the top; jerking quickly; rounding the back as you lower.',
    safety_notes_en = 'People with lower back pain should use a smaller range or ask a coach first. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 57;

UPDATE exercises SET
    instructions_en = '1. Stand slightly wider than hip-width apart, hugging a dumbbell close to your chest with both hands.
2. Push your hips back and bend your knees, lowering as if sitting down on a chair.
3. Lower until your thighs are close to parallel to the floor or within a comfortable range, with your knees tracking over your toes.
4. Push through your whole foot to stand up.',
    steps_en = '1. Stand slightly wider than hip-width apart, hugging a dumbbell close to your chest with both hands.
2. Push your hips back and bend your knees, lowering as if sitting down on a chair.
3. Lower until your thighs are close to parallel to the floor or within a comfortable range, with your knees tracking over your toes.
4. Push through your whole foot to stand up.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you stand up.',
    common_mistakes_en = 'Knees caving inward; lifting the heels; folding the torso forward.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 58;

UPDATE exercises SET
    instructions_en = '1. Stand facing away from a bench with the top of your rear foot on the bench.
2. Step the front foot far enough forward that your knee does not go far past your toes as you lower.
3. Lower straight down until your front thigh is close to parallel to the floor.
4. Push through the front foot to stand up. Finish one side, then switch sides.',
    steps_en = '1. Stand facing away from a bench with the top of your rear foot on the bench.
2. Step the front foot far enough forward that your knee does not go far past your toes as you lower.
3. Lower straight down until your front thigh is close to parallel to the floor.
4. Push through the front foot to stand up. Finish one side, then switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you stand up.',
    common_mistakes_en = 'Placing the front foot too close to the bench; knees caving inward; pushing mostly through the back leg.',
    safety_notes_en = 'Train near a rack or wall to hold on if you lose balance. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 59;

UPDATE exercises SET
    instructions_en = '1. Adjust the backrest so your knee joint lines up with the machine''s pivot axis.
2. Place the leg pad just above your ankles and grip the handles at your sides.
3. Extend your knees to lift the pad until your legs are almost straight.
4. Lower slowly back to the starting position.',
    steps_en = '1. Adjust the backrest so your knee joint lines up with the machine''s pivot axis.
2. Place the leg pad just above your ankles and grip the handles at your sides.
3. Extend your knees to lift the pad until your legs are almost straight.
4. Lower slowly back to the starting position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you extend your legs, inhale as you lower.',
    common_mistakes_en = 'Kicking the legs with momentum; lifting the hips off the seat; locking the knees hard at the top.',
    safety_notes_en = 'Choose a light load and a comfortable range if you have had a knee injury. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 60;

UPDATE exercises SET
    instructions_en = '1. Lie face down on the machine, pad right on your heels, knees at the edge of the pad.
2. Grip the handles and press your hips down into the pad.
3. Bend your knees and curl the pad toward your glutes.
4. Lower slowly until your legs are nearly straight.',
    steps_en = '1. Lie face down on the machine, pad right on your heels, knees at the edge of the pad.
2. Grip the handles and press your hips down into the pad.
3. Bend your knees and curl the pad toward your glutes.
4. Lower slowly until your legs are nearly straight.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl up, inhale as you lower.',
    common_mistakes_en = 'Lifting hips off the pad; jerking the weight; letting it drop on the way down.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 61;

UPDATE exercises SET
    instructions_en = '1. Sit on the floor with your upper back against the edge of a bench, a padded bar across your hips.
2. Bend your knees, both feet flat and hip-width apart.
3. Squeeze your glutes and drive your hips up until your body is straight from shoulders to knees.
4. Lower your hips slowly to just above the floor, then repeat.',
    steps_en = '1. Sit on the floor with your upper back against the edge of a bench, a padded bar across your hips.
2. Bend your knees, both feet flat and hip-width apart.
3. Squeeze your glutes and drive your hips up until your body is straight from shoulders to knees.
4. Lower your hips slowly to just above the floor, then repeat.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you drive your hips up, inhale as you lower.',
    common_mistakes_en = 'Arching your lower back instead of driving with your hips; placing your feet too far or too close; tilting your head back.',
    safety_notes_en = 'Always use a bar pad to avoid hip bone pain. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 62;

UPDATE exercises SET
    instructions_en = '1. Stand with the front half of your feet on a step, heels hanging off.
2. Lower your heels below the step within a comfortable range.
3. Rise onto your toes as high as possible and pause for a beat.
4. Lower slowly back to the start.',
    steps_en = '1. Stand with the front half of your feet on a step, heels hanging off.
2. Lower your heels below the step within a comfortable range.
3. Rise onto your toes as high as possible and pause for a beat.
4. Lower slowly back to the start.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you rise, inhale as you lower.',
    common_mistakes_en = 'Bouncing quickly; bending your knees to push; too short a range of motion.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 63;

UPDATE exercises SET
    instructions_en = '1. Set the backrest close to upright, sit back against it with a dumbbell at each shoulder.
2. Palms facing forward, elbows slightly angled forward.
3. Press the dumbbells overhead until your arms are nearly straight.
4. Lower slowly to ear or shoulder level.',
    steps_en = '1. Set the backrest close to upright, sit back against it with a dumbbell at each shoulder.
2. Palms facing forward, elbows slightly angled forward.
3. Press the dumbbells overhead until your arms are nearly straight.
4. Lower slowly to ear or shoulder level.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you press up, inhale as you lower.',
    common_mistakes_en = 'Arching your back off the backrest; lowering the dumbbells too far; banging the dumbbells together at the top.',
    safety_notes_en = 'Skip this exercise if you feel sharp shoulder pain when reaching overhead. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 64;

UPDATE exercises SET
    instructions_en = '1. Hold light dumbbells, hinge at the hips until your torso is nearly parallel to the floor, back flat.
2. Let the dumbbells hang below your shoulders, elbows slightly bent.
3. Raise both arms out to the sides until they are level with your torso, squeezing your shoulder blades.
4. Lower slowly back to the start.',
    steps_en = '1. Hold light dumbbells, hinge at the hips until your torso is nearly parallel to the floor, back flat.
2. Let the dumbbells hang below your shoulders, elbows slightly bent.
3. Raise both arms out to the sides until they are level with your torso, squeezing your shoulder blades.
4. Lower slowly back to the start.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you raise your arms, inhale as you lower.',
    common_mistakes_en = 'Using too heavy a weight and swinging your body; shrugging your shoulders; rounding your back.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 65;

UPDATE exercises SET
    instructions_en = '1. Stand tall with dumbbells in front of your thighs, palms facing your body.
2. Keep your elbows slightly bent and raise the dumbbells in front to shoulder height.
3. Pause for a beat at the top.
4. Lower slowly back in front of your thighs.',
    steps_en = '1. Stand tall with dumbbells in front of your thighs, palms facing your body.
2. Keep your elbows slightly bent and raise the dumbbells in front to shoulder height.
3. Pause for a beat at the top.
4. Lower slowly back in front of your thighs.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you raise, inhale as you lower.',
    common_mistakes_en = 'Leaning back for momentum; raising above shoulder height; shrugging your shoulders.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 66;

UPDATE exercises SET
    instructions_en = '1. Stand tall with dumbbells at your sides, palms facing your body.
2. Keep your elbows close to your hips and curl the dumbbells toward your shoulders.
3. Squeeze your biceps at the top.
4. Lower slowly until your arms are nearly straight.',
    steps_en = '1. Stand tall with dumbbells at your sides, palms facing your body.
2. Keep your elbows close to your hips and curl the dumbbells toward your shoulders.
3. Squeeze your biceps at the top.
4. Lower slowly until your arms are nearly straight.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl up, inhale as you lower.',
    common_mistakes_en = 'Letting your elbows drift forward; swinging your body for momentum; dropping the weight on the way down.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 67;

UPDATE exercises SET
    instructions_en = '1. Sit or stand tall, holding one dumbbell with both hands overhead.
2. Keep your upper arms close to your ears and bend your elbows to lower the dumbbell behind your head.
3. Extend your elbows to press the dumbbell back up until your arms are nearly straight.
4. Repeat slowly and under control.',
    steps_en = '1. Sit or stand tall, holding one dumbbell with both hands overhead.
2. Keep your upper arms close to your ears and bend your elbows to lower the dumbbell behind your head.
3. Extend your elbows to press the dumbbell back up until your arms are nearly straight.
4. Repeat slowly and under control.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you extend up.',
    common_mistakes_en = 'Letting your elbows flare out to the sides; arching your back; lowering the weight too fast.',
    safety_notes_en = 'Choose a weight you can handle so the dumbbell does not hit your head; skip this exercise if you feel shoulder pain when reaching overhead. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 68;

UPDATE exercises SET
    instructions_en = '1. Lie on your back, arms straight up toward the ceiling, hips and knees bent to 90 degrees.
2. Gently press your lower back into the mat and brace your abs.
3. Reach your right arm overhead and your left leg forward, keeping your back on the mat.
4. Return to centre, then switch sides.',
    steps_en = '1. Lie on your back, arms straight up toward the ceiling, hips and knees bent to 90 degrees.
2. Gently press your lower back into the mat and brace your abs.
3. Reach your right arm overhead and your left leg forward, keeping your back on the mat.
4. Return to centre, then switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you reach out, inhale as you return.',
    common_mistakes_en = 'Letting your lower back arch off the mat; moving too fast; holding your breath.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 69;

UPDATE exercises SET
    instructions_en = '1. Lie on your side with your elbow directly under your shoulder, legs stacked and extended.
2. Brace your abs and glutes and lift your hips until your body is straight from head to heels.
3. Hold the position without letting your hips sag.
4. Lower gently, then switch sides.',
    steps_en = '1. Lie on your side with your elbow directly under your shoulder, legs stacked and extended.
2. Brace your abs and glutes and lift your hips until your body is straight from head to heels.
3. Hold the position without letting your hips sag.
4. Lower gently, then switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily; do not hold your breath.',
    common_mistakes_en = 'Sagging hips; rotating your torso forward; placing your elbow too far from your shoulder.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 70;

UPDATE exercises SET
    instructions_en = '1. Get on all fours: hands under shoulders, knees under hips, back flat.
2. Brace your abs, extend your right arm forward and left leg back to torso level.
3. Hold for a beat with your hips square.
4. Return, then switch sides.',
    steps_en = '1. Get on all fours: hands under shoulders, knees under hips, back flat.
2. Brace your abs, extend your right arm forward and left leg back to torso level.
3. Hold for a beat with your hips square.
4. Return, then switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you extend, inhale as you return.',
    common_mistakes_en = 'Raising the leg too high and arching your back; rotating your hips; rushing the movement.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 71;

UPDATE exercises SET
    instructions_en = '1. Set the pulley high, stand side-on to the machine, grip the handle with both hands above your shoulder.
2. Feet wider than shoulder-width, knees slightly soft.
3. Pull the handle diagonally down toward the opposite hip, rotating your torso and pivoting your back foot.
4. Return slowly and under control. Finish one side, then switch.',
    steps_en = '1. Set the pulley high, stand side-on to the machine, grip the handle with both hands above your shoulder.
2. Feet wider than shoulder-width, knees slightly soft.
3. Pull the handle diagonally down toward the opposite hip, rotating your torso and pivoting your back foot.
4. Return slowly and under control. Finish one side, then switch.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull down, inhale as you return.',
    common_mistakes_en = 'Pulling with your arms only; rotating your lower back while your hips stay still; jerking the movement.',
    safety_notes_en = 'If you have back pain, start with a very light weight or ask a coach. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 72;

UPDATE exercises SET
    instructions_en = '1. Sit down, strap your feet in securely, grip the handle, arms extended.
2. Push with your legs first, then lean your torso back slightly and pull the handle toward your lower abdomen.
3. Return in reverse order: extend your arms, lean your torso forward, then bend your knees.
4. Keep a steady rhythm with your back straight.',
    steps_en = '1. Sit down, strap your feet in securely, grip the handle, arms extended.
2. Push with your legs first, then lean your torso back slightly and pull the handle toward your lower abdomen.
3. Return in reverse order: extend your arms, lean your torso forward, then bend your knees.
4. Keep a steady rhythm with your back straight.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull, inhale as you return.',
    common_mistakes_en = 'Pulling with your arms before pushing with your legs; rounding your back; leaning back too far.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or daily.',
    sets_reps_hint_en = NULL
WHERE id = 73;

UPDATE exercises SET
    instructions_en = '1. Step onto the pedals, grip the handles and stand tall.
2. Start pedalling slowly at low resistance to get familiar.
3. Gradually increase speed or resistance to a level where you can still talk but are slightly out of breath.
4. Slow down over the last few minutes before stepping off.',
    steps_en = '1. Step onto the pedals, grip the handles and stand tall.
2. Start pedalling slowly at low resistance to get familiar.
3. Gradually increase speed or resistance to a level where you can still talk but are slightly out of breath.
4. Slow down over the last few minutes before stepping off.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily in rhythm with your pedalling.',
    common_mistakes_en = 'Leaning your whole body on the handles; hunching your back; pedalling on your toes the whole session.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or daily.',
    sets_reps_hint_en = NULL
WHERE id = 74;

UPDATE exercises SET
    instructions_en = '1. Adjust the rope: stand in the middle of it and pull the handles up to armpit height.
2. Elbows close to your body, turn the rope with your wrists.
3. Bounce lightly off the balls of your feet, just enough for the rope to pass.
4. Start with short intervals interspersed with rest, and build up the duration.',
    steps_en = '1. Adjust the rope: stand in the middle of it and pull the handles up to armpit height.
2. Elbows close to your body, turn the rope with your wrists.
3. Bounce lightly off the balls of your feet, just enough for the rope to pass.
4. Start with short intervals interspersed with rest, and build up the duration.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily; slow down if you cannot talk.',
    common_mistakes_en = 'Jumping too high; landing on your heels; turning the rope with your whole arm.',
    safety_notes_en = 'Train on a sprung floor and wear sports shoes; if you have knee or ankle pain, choose a lower-impact exercise. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or daily.',
    sets_reps_hint_en = NULL
WHERE id = 75;

UPDATE exercises SET
    instructions_en = '1. Lower into a proper deadlift position, pick up both dumbbells and stand tall.
2. Shoulders down, chest open, abs braced.
3. Take short, even steps over the planned distance.
4. Set the dumbbells down by hingeing at the hips and knees without rounding your back.',
    steps_en = '1. Lower into a proper deadlift position, pick up both dumbbells and stand tall.
2. Shoulders down, chest open, abs braced.
3. Take short, even steps over the planned distance.
4. Set the dumbbells down by hingeing at the hips and knees without rounding your back.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily; do not hold your breath.',
    common_mistakes_en = 'Leaning to one side; shrugging your shoulders; taking long, rushed steps.',
    safety_notes_en = 'Check that the walking path is clear before starting. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 76;

UPDATE exercises SET
    instructions_en = '1. Get into a high plank with your hands under your shoulders, body straight.
2. Drive your right knee toward your chest, then return it.
3. Switch to your left knee, alternating evenly.
4. Increase the speed once you can keep your body straight.',
    steps_en = '1. Get into a high plank with your hands under your shoulders, body straight.
2. Drive your right knee toward your chest, then return it.
3. Switch to your left knee, alternating evenly.
4. Increase the speed once you can keep your body straight.',
    setup_position_en = NULL,
    breathing_en = 'Breathe steadily in rhythm with your leg switches.',
    common_mistakes_en = 'Piking your hips up high; sagging hips; shoulders drifting behind your wrists.',
    safety_notes_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or daily.',
    sets_reps_hint_en = NULL
WHERE id = 77;

UPDATE exercises SET
    instructions_en = '1. Set the bench to a moderate incline and lie so your eyes are just under the bar.
2. Grip slightly wider than shoulder-width and pull your shoulder blades back and down.
3. Unrack the bar and lower it slowly to your upper chest, elbows angled down.
4. Press the bar up until your arms are nearly straight, then repeat.',
    steps_en = '1. Set the bench to a moderate incline and lie so your eyes are just under the bar.
2. Grip slightly wider than shoulder-width and pull your shoulder blades back and down.
3. Unrack the bar and lower it slowly to your upper chest, elbows angled down.
4. Press the bar up until your arms are nearly straight, then repeat.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower the bar, exhale as you press up.',
    common_mistakes_en = 'Bench set too steep so the work shifts to your shoulders; bouncing the bar off your chest; lifting your hips off the bench.',
    safety_notes_en = 'Heavy sets need a spotter or safety pins. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 78;

UPDATE exercises SET
    instructions_en = '1. Hook your legs under the leg pads and lie down on the decline bench.
2. Grip wider than shoulder-width and have a spotter help unrack the bar.
3. Lower the bar slowly to your lower chest.
4. Press the bar up until your arms are nearly straight, then repeat.',
    steps_en = '1. Hook your legs under the leg pads and lie down on the decline bench.
2. Grip wider than shoulder-width and have a spotter help unrack the bar.
3. Lower the bar slowly to your lower chest.
4. Press the bar up until your arms are nearly straight, then repeat.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you press.',
    common_mistakes_en = 'Lowering the bar onto your neck; dropping the bar; staying head-down for too long.',
    safety_notes_en = 'If you have high blood pressure or tend to get dizzy with your head down, choose a different exercise. Always have a spotter. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 79;

UPDATE exercises SET
    instructions_en = '1. Lie on your back on a bench, dumbbells pressed straight up over your chest, palms facing each other.
2. Bend your elbows slightly and keep that angle fixed.
3. Open your arms out to the sides in an arc until you feel a moderate stretch in your chest.
4. Bring your arms back together over your chest as if hugging a large tree trunk.',
    steps_en = '1. Lie on your back on a bench, dumbbells pressed straight up over your chest, palms facing each other.
2. Bend your elbows slightly and keep that angle fixed.
3. Open your arms out to the sides in an arc until you feel a moderate stretch in your chest.
4. Bring your arms back together over your chest as if hugging a large tree trunk.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you open your arms, exhale as you bring them together.',
    common_mistakes_en = 'Straightening your elbows and stressing the joint; opening your arms too far below shoulder level; using too heavy a weight.',
    safety_notes_en = 'Choose a lighter weight than for chest pressing; stop if you feel pain at the front of your shoulder. Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point of needing a short rest before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 80;

UPDATE exercises SET
    instructions_en = '1. Set both pulleys at the lowest position, grab the handles, and step forward one step.
2. Slightly bend the elbows, arms hanging diagonally down at your sides.
3. Bring both arms diagonally up in front of you to shoulder height, squeezing the chest.
4. Lower the arms slowly back to the starting position.',
    steps_en = '1. Set both pulleys at the lowest position, grab the handles, and step forward one step.
2. Slightly bend the elbows, arms hanging diagonally down at your sides.
3. Bring both arms diagonally up in front of you to shoulder height, squeezing the chest.
4. Lower the arms slowly back to the starting position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you raise the arms, inhale as you lower.',
    common_mistakes_en = 'Bending and extending the elbows into a curl; leaning back; jerking the cable.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 81;

UPDATE exercises SET
    instructions_en = '1. Place both hands on the edge of a stable chair, slightly wider than shoulder width.
2. Step your feet back so the body is straight from head to heels.
3. Lower the chest close to the chair edge, elbows angled back.
4. Push back up, keeping the body straight.',
    steps_en = '1. Place both hands on the edge of a stable chair, slightly wider than shoulder width.
2. Step your feet back so the body is straight from head to heels.
3. Lower the chest close to the chair edge, elbows angled back.
4. Push back up, keeping the body straight.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you push up.',
    common_mistakes_en = 'Sagging hips; shrugging the shoulders; the chair sliding.',
    safety_notes_en = 'Place the chair against a wall so it cannot slide. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 82;

UPDATE exercises SET
    instructions_en = '1. Grip the bar shoulder-width with palms facing you, hang with arms extended.
2. Pull the shoulder blades down and brace the abs.
3. Pull yourself up until the chin clears the bar.
4. Lower slowly back to the hanging position.',
    steps_en = '1. Grip the bar shoulder-width with palms facing you, hang with arms extended.
2. Pull the shoulder blades down and brace the abs.
3. Pull yourself up until the chin clears the bar.
4. Lower slowly back to the hanging position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull up, inhale as you lower.',
    common_mistakes_en = 'Swinging for momentum; half-range pulling; dropping down.',
    safety_notes_en = 'Check that the bar is secure. Beginners should use an assisted machine or resistance bands. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 83;

UPDATE exercises SET
    instructions_en = '1. Attach a close grip handle, adjust the pad so it fits snugly over the thighs.
2. Sit upright, lean back slightly, chest open.
3. Pull the handle down to the upper chest, elbows close to the body.
4. Return slowly until the arms are nearly extended.',
    steps_en = '1. Attach a close grip handle, adjust the pad so it fits snugly over the thighs.
2. Sit upright, lean back slightly, chest open.
3. Pull the handle down to the upper chest, elbows close to the body.
4. Return slowly until the arms are nearly extended.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull down, inhale as you return.',
    common_mistakes_en = 'Leaning back too much; shrugging the shoulders; pulling with the hands instead of the elbows.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 84;

UPDATE exercises SET
    instructions_en = '1. Set the pulley high, grip the bar shoulder-width, and step back one step.
2. Hinge slightly at the hips, arms nearly straight at face height.
3. Pull the bar in an arc down to your thighs, squeezing the back.
4. Return slowly, keeping the elbows nearly straight throughout.',
    steps_en = '1. Set the pulley high, grip the bar shoulder-width, and step back one step.
2. Hinge slightly at the hips, arms nearly straight at face height.
3. Pull the bar in an arc down to your thighs, squeezing the back.
4. Return slowly, keeping the elbows nearly straight throughout.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull down, inhale as you return.',
    common_mistakes_en = 'Bending the elbows into a triceps pushdown; leaning forward for momentum; shrugging the shoulders.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 85;

UPDATE exercises SET
    instructions_en = '1. Stand astride the bar, attach a V-handle under the weight plates.
2. Hinge at the hips, back straight, torso at about 45 degrees.
3. Pull the handle toward the lower chest, squeeze the shoulder blades together.
4. Lower slowly until the arms are extended.',
    steps_en = '1. Stand astride the bar, attach a V-handle under the weight plates.
2. Hinge at the hips, back straight, torso at about 45 degrees.
3. Pull the handle toward the lower chest, squeeze the shoulder blades together.
4. Lower slowly until the arms are extended.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull, inhale as you lower.',
    common_mistakes_en = 'Rounding the back; gradually standing upright; jerking with momentum.',
    safety_notes_en = 'People with lower back pain should use a T-bar machine with a chest pad. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 86;

UPDATE exercises SET
    instructions_en = '1. Adjust the seat so the handles are at lower-chest height, press the chest against the pad.
2. Grab the handles, arms extended.
3. Pull toward the body, squeeze the shoulder blades, elbows going back.
4. Return slowly.',
    steps_en = '1. Adjust the seat so the handles are at lower-chest height, press the chest against the pad.
2. Grab the handles, arms extended.
3. Pull toward the body, squeeze the shoulder blades, elbows going back.
4. Return slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull, inhale as you return.',
    common_mistakes_en = 'Lifting the chest off the pad; shrugging the shoulders; letting the weight stack slam.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 87;

UPDATE exercises SET
    instructions_en = '1. Lie face down on the mat, arms extended forward, legs straight.
2. Squeeze the glutes, lift the arms, chest and legs slightly off the mat.
3. Hold for 1–2 counts, neck straight, eyes looking at the floor.
4. Lower slowly and repeat.',
    steps_en = '1. Lie face down on the mat, arms extended forward, legs straight.
2. Squeeze the glutes, lift the arms, chest and legs slightly off the mat.
3. Hold for 1–2 counts, neck straight, eyes looking at the floor.
4. Lower slowly and repeat.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you lift, inhale as you lower.',
    common_mistakes_en = 'Tilting the neck up; lifting too high and arching the lower back; jerking quickly.',
    safety_notes_en = 'People with lower back pain should use a very small range of motion or choose Bird Dog instead. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 88;

UPDATE exercises SET
    instructions_en = '1. Place a light bar on the upper back as in a squat, feet hip-width apart, knees slightly bent.
2. Brace the abs, push the hips back, torso tipping forward, back kept straight.
3. Stop when the hamstrings feel stretched or the torso is near parallel to the floor.
4. Drive the hips forward to stand up.',
    steps_en = '1. Place a light bar on the upper back as in a squat, feet hip-width apart, knees slightly bent.
2. Brace the abs, push the hips back, torso tipping forward, back kept straight.
3. Stop when the hamstrings feel stretched or the torso is near parallel to the floor.
4. Drive the hips forward to stand up.',
    setup_position_en = NULL,
    breathing_en = 'Inhale before hinging, exhale as you stand up.',
    common_mistakes_en = 'Rounding the back; bending the knees as much as a squat; using too heavy a weight.',
    safety_notes_en = 'Start with an empty bar or a stick to learn the movement; people with back pain should avoid it. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 89;

UPDATE exercises SET
    instructions_en = '1. Stand tall, hold the bar in front of the thighs shoulder-width, arms extended.
2. Shrug both shoulders straight up toward the ears.
3. Hold for one count at the top.
4. Lower the shoulders slowly through the full range.',
    steps_en = '1. Stand tall, hold the bar in front of the thighs shoulder-width, arms extended.
2. Shrug both shoulders straight up toward the ears.
3. Hold for one count at the top.
4. Lower the shoulders slowly through the full range.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you shrug, inhale as you lower.',
    common_mistakes_en = 'Rolling the shoulders in circles; bending the elbows to pull the bar; jutting the head forward.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 90;

UPDATE exercises SET
    instructions_en = '1. Stand tall, a dumbbell in each hand at your sides, palms facing the body.
2. Shrug as high as you can.
3. Hold for one count.
4. Lower slowly to the starting position.',
    steps_en = '1. Stand tall, a dumbbell in each hand at your sides, palms facing the body.
2. Shrug as high as you can.
3. Hold for one count.
4. Lower slowly to the starting position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you shrug, inhale as you lower.',
    common_mistakes_en = 'Rotating the shoulders; using too heavy a weight, shortening the range; pushing the chin forward.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 91;

UPDATE exercises SET
    instructions_en = '1. Stand tall, hold the bar in front of the thighs, hands shoulder-width apart.
2. Pull the bar up along the body, elbows leading and higher than the wrists.
3. Stop when the elbows reach shoulder height, bar around chest level.
4. Lower slowly.',
    steps_en = '1. Stand tall, hold the bar in front of the thighs, hands shoulder-width apart.
2. Pull the bar up along the body, elbows leading and higher than the wrists.
3. Stop when the elbows reach shoulder height, bar around chest level.
4. Lower slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you pull up, inhale as you lower.',
    common_mistakes_en = 'Gripping too narrow; pulling above the shoulders; jerking the bar.',
    safety_notes_en = 'Grip shoulder-width and pull only to shoulder height to reduce load on the shoulder joints; skip the exercise if you feel sharp shoulder pain. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 92;

UPDATE exercises SET
    instructions_en = '1. Sit with your back supported, two dumbbells in front of you at chin height, palms facing you.
2. As you press up, rotate the wrists so the palms face forward.
3. Press until the arms are nearly fully extended overhead.
4. Lower and rotate back to the starting position.',
    steps_en = '1. Sit with your back supported, two dumbbells in front of you at chin height, palms facing you.
2. As you press up, rotate the wrists so the palms face forward.
3. Press until the arms are nearly fully extended overhead.
4. Lower and rotate back to the starting position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you press, inhale as you lower.',
    common_mistakes_en = 'Arching the back off the support; jerky wrist rotation; lowering the weights too fast.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 93;

UPDATE exercises SET
    instructions_en = '1. Adjust the seat so the handles are at shoulder height, sit with your back supported.
2. Grab the handles, both feet flat on the floor.
3. Press up until the arms are nearly fully extended.
4. Lower slowly to shoulder height.',
    steps_en = '1. Adjust the seat so the handles are at shoulder height, sit with your back supported.
2. Grab the handles, both feet flat on the floor.
3. Press up until the arms are nearly fully extended.
4. Lower slowly to shoulder height.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you press, inhale as you lower.',
    common_mistakes_en = 'Seat too low, forcing the shoulders into a deep flexed position; arching the back; locking the elbows hard.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 94;

UPDATE exercises SET
    instructions_en = '1. Set the pulley low, stand side-on to the machine, hold the handle with the far hand.
2. Elbow slightly bent, the other hand steadying on the machine.
3. Raise the arm out to the side to shoulder height.
4. Lower slowly. Finish one side, then switch sides.',
    steps_en = '1. Set the pulley low, stand side-on to the machine, hold the handle with the far hand.
2. Elbow slightly bent, the other hand steadying on the machine.
3. Raise the arm out to the side to shoulder height.
4. Lower slowly. Finish one side, then switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you raise, inhale as you lower.',
    common_mistakes_en = 'Leaning the body for momentum; shrugging the shoulders; raising above shoulder height.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 95;

UPDATE exercises SET
    instructions_en = '1. Set both pulleys at shoulder height, grip crosswise: right hand holds the left cable and vice versa.
2. Stand in the middle, arms extended in front of you, elbows slightly bent.
3. Pull both arms out to the sides until they are in line with the shoulders.
4. Return slowly.',
    steps_en = '1. Set both pulleys at shoulder height, grip crosswise: right hand holds the left cable and vice versa.
2. Stand in the middle, arms extended in front of you, elbows slightly bent.
3. Pull both arms out to the sides until they are in line with the shoulders.
4. Return slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you open the arms, inhale as you return.',
    common_mistakes_en = 'Leaning back; shrugging the shoulders; bending the elbows into a pulling motion.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 96;

UPDATE exercises SET
    instructions_en = '1. Stand tall, a dumbbell in each hand at your sides, elbows close to the hips.
2. Curl the weights up, rotating the palms to face upward.
3. Squeeze the biceps at the top.
4. Lower slowly until the arms are nearly extended.',
    steps_en = '1. Stand tall, a dumbbell in each hand at your sides, elbows close to the hips.
2. Curl the weights up, rotating the palms to face upward.
3. Squeeze the biceps at the top.
4. Lower slowly until the arms are nearly extended.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl, inhale as you lower.',
    common_mistakes_en = 'Swinging the body for momentum; elbows drifting forward; dropping the weights.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 97;

UPDATE exercises SET
    instructions_en = '1. Sit, press the back of the upper arms onto the pad, armpits at the pad edge.
2. Grip the bar underhand, shoulder-width apart.
3. Curl the bar up until the forearms are nearly vertical.
4. Lower slowly until the arms are nearly extended, without locking the elbows straight.',
    steps_en = '1. Sit, press the back of the upper arms onto the pad, armpits at the pad edge.
2. Grip the bar underhand, shoulder-width apart.
3. Curl the bar up until the forearms are nearly vertical.
4. Lower slowly until the arms are nearly extended, without locking the elbows straight.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl, inhale as you lower.',
    common_mistakes_en = 'Lifting the elbows off the pad; dropping the bar at the bottom; using too heavy a weight.',
    safety_notes_en = 'Do not snap the elbows straight at the end of the lowering phase to avoid straining the biceps tendon. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 98;

UPDATE exercises SET
    instructions_en = '1. Sit at the edge of a bench, legs spread wide, hold a dumbbell and rest the elbow on the inner thigh on the same side.
2. Let the arm hang straight down.
3. Curl the weight up toward the shoulder, squeezing the biceps.
4. Lower slowly. Finish one side, then switch sides.',
    steps_en = '1. Sit at the edge of a bench, legs spread wide, hold a dumbbell and rest the elbow on the inner thigh on the same side.
2. Let the arm hang straight down.
3. Curl the weight up toward the shoulder, squeezing the biceps.
4. Lower slowly. Finish one side, then switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl, inhale as you lower.',
    common_mistakes_en = 'Lifting the elbow off the thigh; rotating the torso to pull the weight; rushing.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 99;

UPDATE exercises SET
    instructions_en = '1. Set the pulley low, attach a straight bar, grip underhand shoulder-width apart.
2. Stand tall, elbows close to the hips.
3. Curl the bar up to chest height.
4. Lower slowly.',
    steps_en = '1. Set the pulley low, attach a straight bar, grip underhand shoulder-width apart.
2. Stand tall, elbows close to the hips.
3. Curl the bar up to chest height.
4. Lower slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl, inhale as you lower.',
    common_mistakes_en = 'Leaning back; elbows moving forward; standing too close to the machine.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or have recently given birth should consult a healthcare professional before exercising.',
    suggested_dose_en = 'No personalized dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the trainer.',
    sets_reps_hint_en = NULL
WHERE id = 100;

UPDATE exercises SET
    instructions_en = '1. Stand tall, hold an EZ bar at the outer curves, arms extended in front of your thighs.
2. Keep elbows close to your body, curl the bar up to shoulder level.
3. Squeeze at the top for a beat.
4. Lower slowly.',
    steps_en = '1. Stand tall, hold an EZ bar at the outer curves, arms extended in front of your thighs.
2. Keep elbows close to your body, curl the bar up to shoulder level.
3. Squeeze at the top for a beat.
4. Lower slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl, inhale as you lower.',
    common_mistakes_en = 'Swinging your torso; elbows drifting forward; lowering too fast.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 101;

UPDATE exercises SET
    instructions_en = '1. Lie face up on a bench, hold an EZ bar straight above your chest.
2. Keep your upper arms still, bend your elbows and lower the bar toward your forehead or behind the top of your head.
3. Extend your elbows to bring the bar back up.
4. Repeat slowly and under control.',
    steps_en = '1. Lie face up on a bench, hold an EZ bar straight above your chest.
2. Keep your upper arms still, bend your elbows and lower the bar toward your forehead or behind the top of your head.
3. Extend your elbows to bring the bar back up.
4. Repeat slowly and under control.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you extend up.',
    common_mistakes_en = 'Flaring elbows out to the sides; upper arms drifting back and forth; lowering too fast.',
    safety_notes_en = 'Choose a manageable load and use a spotter when lifting heavy, since the bar passes over your face. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 102;

UPDATE exercises SET
    instructions_en = '1. Lie down as for a chest press, grip the bar shoulder-width.
2. Unrack the bar, lower it slowly to your lower chest with elbows close to your body.
3. Press the bar up until your arms are nearly straight.
4. Repeat.',
    steps_en = '1. Lie down as for a chest press, grip the bar shoulder-width.
2. Unrack the bar, lower it slowly to your lower chest with elbows close to your body.
3. Press the bar up until your arms are nearly straight.
4. Repeat.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you press.',
    common_mistakes_en = 'Gripping too narrow and hurting your wrists; flaring elbows; bouncing the bar.',
    safety_notes_en = 'Use a spotter or safety pins when lifting heavy. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 103;

UPDATE exercises SET
    instructions_en = '1. Sit at the edge of a bench, place your hands on the edge beside your hips, fingers pointing forward.
2. Slide your hips off the bench, legs straight or knees bent.
3. Bend your elbows and lower yourself until your upper arms are nearly parallel to the floor.
4. Push yourself back up.',
    steps_en = '1. Sit at the edge of a bench, place your hands on the edge beside your hips, fingers pointing forward.
2. Slide your hips off the bench, legs straight or knees bent.
3. Bend your elbows and lower yourself until your upper arms are nearly parallel to the floor.
4. Push yourself back up.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you push up.',
    common_mistakes_en = 'Lowering too deep; shrugging your shoulders toward your ears; letting your hips drift far from the bench.',
    safety_notes_en = 'Skip this exercise if you feel pain at the front of the shoulder; bend your knees to reduce difficulty. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 104;

UPDATE exercises SET
    instructions_en = '1. Set the pulley low or high, attach a rope, and face away from the machine.
2. Step one foot forward, hold the rope behind your head with both hands, elbows pointing up.
3. Extend your elbows to bring the rope forward and up.
4. Return slowly, keeping your upper arms still.',
    steps_en = '1. Set the pulley low or high, attach a rope, and face away from the machine.
2. Step one foot forward, hold the rope behind your head with both hands, elbows pointing up.
3. Extend your elbows to bring the rope forward and up.
4. Return slowly, keeping your upper arms still.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you extend, inhale as you return.',
    common_mistakes_en = 'Flaring elbows out to the sides; arching your back; using your torso to pull.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 105;

UPDATE exercises SET
    instructions_en = '1. Set the pulley high, hold both ends of the rope, elbows tucked to your sides.
2. Extend your arms and press the rope down.
3. Split your hands out to the sides at the bottom and squeeze your triceps.
4. Return slowly until your forearms are nearly horizontal.',
    steps_en = '1. Set the pulley high, hold both ends of the rope, elbows tucked to your sides.
2. Extend your arms and press the rope down.
3. Split your hands out to the sides at the bottom and squeeze your triceps.
4. Return slowly until your forearms are nearly horizontal.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you press down, inhale as you return.',
    common_mistakes_en = 'Elbows leaving your sides; leaning over the rope; returning up too high.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 106;

UPDATE exercises SET
    instructions_en = '1. Sit, rest your forearms on your thighs or a bench with your wrists past the edge, palms up.
2. Hold a light bar and let your wrists drop low.
3. Curl your wrists up as high as possible.
4. Lower slowly.',
    steps_en = '1. Sit, rest your forearms on your thighs or a bench with your wrists past the edge, palms up.
2. Hold a light bar and let your wrists drop low.
3. Curl your wrists up as high as possible.
4. Lower slowly.',
    setup_position_en = NULL,
    breathing_en = 'Breathe evenly with the curling rhythm.',
    common_mistakes_en = 'Lifting your forearms off your thighs; using too heavy a weight; jerking quickly.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 107;

UPDATE exercises SET
    instructions_en = '1. Stand tall, hold a bar with an overhand grip shoulder-width.
2. Keep elbows close to your body, curl the bar up to shoulder level.
3. Keep your wrists straight.
4. Lower slowly.',
    steps_en = '1. Stand tall, hold a bar with an overhand grip shoulder-width.
2. Keep elbows close to your body, curl the bar up to shoulder level.
3. Keep your wrists straight.
4. Lower slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl, inhale as you lower.',
    common_mistakes_en = 'Bending your wrists; swinging your body; using a weight as heavy as for regular curls.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 108;

UPDATE exercises SET
    instructions_en = '1. Pinch two light plates together with the smooth sides facing out.
2. Grip them between your thumb and remaining fingers.
3. Lift, stand tall, and hold for the time your coach sets.
4. Set them down by bending your knees.',
    steps_en = '1. Pinch two light plates together with the smooth sides facing out.
2. Grip them between your thumb and remaining fingers.
3. Lift, stand tall, and hold for the time your coach sets.
4. Set them down by bending your knees.',
    setup_position_en = NULL,
    breathing_en = 'Breathe evenly, don''t hold your breath.',
    common_mistakes_en = 'Hugging the plates to your body; rounding your back when picking up; choosing plates that are too heavy.',
    safety_notes_en = 'Stand in an open space, not near other people''s feet in case you drop the plates. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 109;

UPDATE exercises SET
    instructions_en = '1. Lie face up, knees bent, feet flat.
2. Place your hands on your chest or lightly touch the sides of your head.
3. Brace your abs and curl your shoulders and upper back off the mat.
4. Lower slowly, keeping your lower back on the mat.',
    steps_en = '1. Lie face up, knees bent, feet flat.
2. Place your hands on your chest or lightly touch the sides of your head.
3. Brace your abs and curl your shoulders and upper back off the mat.
4. Lower slowly, keeping your lower back on the mat.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl up, inhale as you lower.',
    common_mistakes_en = 'Pulling your neck with your hands; bouncing up with momentum; lifting your lower back.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 110;

UPDATE exercises SET
    instructions_en = '1. Set the pulley high, attach a rope, and kneel facing the machine.
2. Hold the rope beside your head.
3. Curl your torso down, pulling your elbows toward your thighs with your abs.
4. Return slowly, keeping your hips still.',
    steps_en = '1. Set the pulley high, attach a rope, and kneel facing the machine.
2. Hold the rope beside your head.
3. Curl your torso down, pulling your elbows toward your thighs with your abs.
4. Return slowly, keeping your hips still.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl down, inhale as you return.',
    common_mistakes_en = 'Sitting back onto your heels (using hips instead of abs); pulling with your arms; jerking quickly.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 111;

UPDATE exercises SET
    instructions_en = '1. Kneel on a mat, hold the wheel under your shoulders with both hands.
2. Brace your abs and glutes and roll the wheel forward slowly.
3. Stop before your lower back starts to sag.
4. Pull the wheel back with your abs.',
    steps_en = '1. Kneel on a mat, hold the wheel under your shoulders with both hands.
2. Brace your abs and glutes and roll the wheel forward slowly.
3. Stop before your lower back starts to sag.
4. Pull the wheel back with your abs.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you roll out, exhale as you pull back.',
    common_mistakes_en = 'Sagging your back; rolling out too far before you are strong enough; hiking your hips when pulling back.',
    safety_notes_en = 'Beginners should roll a short range or roll into a wall as a stop. People with back pain should ask a coach. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 112;

UPDATE exercises SET
    instructions_en = '1. Lie face up, place your hands under your hips or grip the bench edge.
2. Press your lower back down, legs straight or knees slightly bent.
3. Raise your legs until nearly perpendicular to your torso.
4. Lower slowly and stop before your lower back arches off the mat.',
    steps_en = '1. Lie face up, place your hands under your hips or grip the bench edge.
2. Press your lower back down, legs straight or knees slightly bent.
3. Raise your legs until nearly perpendicular to your torso.
4. Lower slowly and stop before your lower back arches off the mat.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you lift, inhale as you lower.',
    common_mistakes_en = 'Arching your back as you lower; kicking with momentum; holding your breath.',
    safety_notes_en = 'Bend your knees if you feel tension in your lower back. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 113;

UPDATE exercises SET
    instructions_en = '1. Lie face up, hips and knees bent about 90 degrees, arms by your sides.
2. Brace your abs and curl your hips off the mat, bringing your knees toward your chest.
3. Hold for a beat.
4. Lower slowly to the start position.',
    steps_en = '1. Lie face up, hips and knees bent about 90 degrees, arms by your sides.
2. Brace your abs and curl your hips off the mat, bringing your knees toward your chest.
3. Hold for a beat.
4. Lower slowly to the start position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl, inhale as you lower.',
    common_mistakes_en = 'Swinging your legs for momentum; pushing your hands into the floor to lift; lowering too fast.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 114;

UPDATE exercises SET
    instructions_en = '1. Lie face up, hands lightly touching the sides of your head, shoulders off the mat, hips and knees bent 90 degrees.
2. Extend your right leg while rotating your torso to bring your right elbow toward your left knee.
3. Switch sides.
4. Alternate evenly and under control.',
    steps_en = '1. Lie face up, hands lightly touching the sides of your head, shoulders off the mat, hips and knees bent 90 degrees.
2. Extend your right leg while rotating your torso to bring your right elbow toward your left knee.
3. Switch sides.
4. Alternate evenly and under control.',
    setup_position_en = NULL,
    breathing_en = 'Exhale on each rotation, don''t hold your breath.',
    common_mistakes_en = 'Pulling your neck; going too fast and only swinging your elbows; arching your lower back.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 115;

UPDATE exercises SET
    instructions_en = '1. Adjust the bench, sit down, hook your legs under the pad, grip the handles.
2. Select a light weight.
3. Curl your torso forward with your abs.
4. Return slowly.',
    steps_en = '1. Adjust the bench, sit down, hook your legs under the pad, grip the handles.
2. Select a light weight.
3. Curl your torso forward with your abs.
4. Return slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl, inhale as you return.',
    common_mistakes_en = 'Pulling with your arms; using too heavy a weight; jerking quickly.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 116;

UPDATE exercises SET
    instructions_en = '1. Sit, knees bent, lean your torso back about 45 degrees with your back straight.
2. Hold a light weight at your chest with both hands (or no weight).
3. Rotate your torso to the right, then to the left.
4. Your heels may touch the floor when you are new to it.',
    steps_en = '1. Sit, knees bent, lean your torso back about 45 degrees with your back straight.
2. Hold a light weight at your chest with both hands (or no weight).
3. Rotate your torso to the right, then to the left.
4. Your heels may touch the floor when you are new to it.',
    setup_position_en = NULL,
    breathing_en = 'Exhale on each rotation.',
    common_mistakes_en = 'Rounding your back; only swinging your arms without rotating your torso; going too fast.',
    safety_notes_en = 'People with lower back pain should choose the Pallof press instead. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 117;

UPDATE exercises SET
    instructions_en = '1. Stand tall, hold a weight at your side in one hand, the other hand on your hip.
2. Bend your torso toward the weighted side.
3. Pull your torso back to straight with the obliques on the opposite side.
4. Do one side, then switch.',
    steps_en = '1. Stand tall, hold a weight at your side in one hand, the other hand on your hip.
2. Bend your torso toward the weighted side.
3. Pull your torso back to straight with the obliques on the opposite side.
4. Do one side, then switch.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you bend, exhale as you pull back.',
    common_mistakes_en = 'Rotating your torso forward; holding the weight with both hands; bending too deep.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 118;

UPDATE exercises SET
    instructions_en = '1. Set the pulley at chest height, stand side-on to the machine, hold the handle close to your chest with both hands.
2. Feet shoulder-width apart, knees slightly soft, brace your abs.
3. Press your arms straight forward, hold 1–2 beats without rotating your torso.
4. Bring it back to your chest. Do one side, then switch.',
    steps_en = '1. Set the pulley at chest height, stand side-on to the machine, hold the handle close to your chest with both hands.
2. Feet shoulder-width apart, knees slightly soft, brace your abs.
3. Press your arms straight forward, hold 1–2 beats without rotating your torso.
4. Bring it back to your chest. Do one side, then switch.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you press out, inhale as you return.',
    common_mistakes_en = 'Letting your torso rotate with the cable; standing too close to the machine; holding your breath.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 119;

UPDATE exercises SET
    instructions_en = '1. Place the bar on the front of your shoulders, elbows high, fingers lightly supporting the bar.
2. Step back from the rack, feet shoulder-width apart.
3. Lower down, keeping your torso upright and elbows high.
4. Push through the floor to stand up.',
    steps_en = '1. Place the bar on the front of your shoulders, elbows high, fingers lightly supporting the bar.
2. Step back from the rack, feet shoulder-width apart.
3. Lower down, keeping your torso upright and elbows high.
4. Push through the floor to stand up.',
    setup_position_en = NULL,
    breathing_en = 'Inhale and hold as you go down, exhale as you stand up.',
    common_mistakes_en = 'Elbows dropping so the bar rolls forward; heels lifting; knees caving inward.',
    safety_notes_en = 'Set the safety pins; practice with an empty bar first. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalised dose available. General recommendation for adults 19–64 years: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps, and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 120;

UPDATE exercises SET
    instructions_en = '1. Lean your back and shoulders against the pad, feet placed shoulder-width apart on the platform.
2. Release the safety catch.
3. Bend your knees and lower within a comfortable range.
4. Push up until your legs are nearly straight, then engage the catch at the end.',
    steps_en = '1. Lean your back and shoulders against the pad, feet placed shoulder-width apart on the platform.
2. Release the safety catch.
3. Bend your knees and lower within a comfortable range.
4. Push up until your legs are nearly straight, then engage the catch at the end.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you push up.',
    common_mistakes_en = 'Heels lifting off the platform; locking the knees hard; lowering too fast.',
    safety_notes_en = 'Always engage the safety catch at the end of the set. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 121;

UPDATE exercises SET
    instructions_en = '1. Place the bar on your upper back, feet slightly in front of the bar.
2. Rotate the bar to release the hooks.
3. Lower down, knees tracking over your toes.
4. Push up, rotate the bar to re-rack at the end.',
    steps_en = '1. Place the bar on your upper back, feet slightly in front of the bar.
2. Rotate the bar to release the hooks.
3. Lower down, knees tracking over your toes.
4. Push up, rotate the bar to re-rack at the end.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you stand up.',
    common_mistakes_en = 'Standing directly under the bar so the knees drift forward; forgetting to re-rack the bar; rounding the back.',
    safety_notes_en = 'Set the safety stops at the right height before training. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 122;

UPDATE exercises SET
    instructions_en = '1. Stand in front of a box about knee height, a dumbbell in each hand.
2. Place your whole right foot on the box.
3. Push through the right foot to stand up on the box, the left leg following.
4. Step down under control. Finish one side, then switch.',
    steps_en = '1. Stand in front of a box about knee height, a dumbbell in each hand.
2. Place your whole right foot on the box.
3. Push through the right foot to stand up on the box, the left leg following.
4. Step down under control. Finish one side, then switch.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you step up, inhale as you come down.',
    common_mistakes_en = 'Pushing off the back leg; box too high; leaning the torso forward.',
    safety_notes_en = 'Use a sturdy, non-slip box; practice without weight first. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 123;

UPDATE exercises SET
    instructions_en = '1. Stand tall, a dumbbell in each hand.
2. Step one leg back and lower until both knees are bent to about 90 degrees.
3. Push through the front leg to stand up, bringing the back leg in.
4. Switch legs.',
    steps_en = '1. Stand tall, a dumbbell in each hand.
2. Step one leg back and lower until both knees are bent to about 90 degrees.
3. Push through the front leg to stand up, bringing the back leg in.
4. Switch legs.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you stand up.',
    common_mistakes_en = 'Step too short; torso collapsing forward; front knee caving inward.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 124;

UPDATE exercises SET
    instructions_en = '1. Adjust the backrest so your knees line up with the pivot axis, pad just above the heels.
2. Lower the pad while keeping your thighs pressed firmly down.
3. Bend your knees and pull the pad down under the seat.
4. Return slowly.',
    steps_en = '1. Adjust the backrest so your knees line up with the pivot axis, pad just above the heels.
2. Lower the pad while keeping your thighs pressed firmly down.
3. Bend your knees and pull the pad down under the seat.
4. Return slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you curl, inhale as you return.',
    common_mistakes_en = 'Lifting the hips; jerking fast; letting the weight drop on the return.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 125;

UPDATE exercises SET
    instructions_en = '1. Stand with feet much wider than shoulder-width, toes turned out, bar over the middle of your feet.
2. Lower your hips, grip the bar between your knees, back straight.
3. Push your knees out over your toes, drive through the floor and pull the bar up.
4. Stand tall, then lower along the same path.',
    steps_en = '1. Stand with feet much wider than shoulder-width, toes turned out, bar over the middle of your feet.
2. Lower your hips, grip the bar between your knees, back straight.
3. Push your knees out over your toes, drive through the floor and pull the bar up.
4. Stand tall, then lower along the same path.',
    setup_position_en = NULL,
    breathing_en = 'Take a deep breath and brace your core before pulling; exhale after standing tall.',
    common_mistakes_en = 'Knees caving inward; rounding the back; hips shooting up ahead of the shoulders.',
    safety_notes_en = 'Learn the technique with a coach, start with light weight. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 126;

UPDATE exercises SET
    instructions_en = '1. Stand tall, dumbbells in front of your thighs, knees slightly bent.
2. Push your hips back, slide the weights down along your legs, back straight.
3. Stop when your hamstrings feel stretched.
4. Drive your hips forward to stand up.',
    steps_en = '1. Stand tall, dumbbells in front of your thighs, knees slightly bent.
2. Push your hips back, slide the weights down along your legs, back straight.
3. Stop when your hamstrings feel stretched.
4. Drive your hips forward to stand up.',
    setup_position_en = NULL,
    breathing_en = 'Inhale as you lower, exhale as you stand up.',
    common_mistakes_en = 'Rounding the back; locking the knees straight; weights drifting away from the legs.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 127;

UPDATE exercises SET
    instructions_en = '1. Lie on your back, knees bent, feet flat hip-width apart.
2. Squeeze your glutes and lift your hips until your body is straight from shoulders to knees.
3. Hold for one beat.
4. Lower slowly.',
    steps_en = '1. Lie on your back, knees bent, feet flat hip-width apart.
2. Squeeze your glutes and lift your hips until your body is straight from shoulders to knees.
3. Hold for one beat.
4. Lower slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you lift your hips, inhale as you lower.',
    common_mistakes_en = 'Arching the lower back; placing the feet too far away; pushing through the toes.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 128;

UPDATE exercises SET
    instructions_en = '1. Lie on your back, one foot on the floor, the other leg straight and lifted.
2. Drive through the heel of the supporting foot and lift your hips.
3. Keep your hips level, without tilting.
4. Lower slowly. Switch sides.',
    steps_en = '1. Lie on your back, one foot on the floor, the other leg straight and lifted.
2. Drive through the heel of the supporting foot and lift your hips.
3. Keep your hips level, without tilting.
4. Lower slowly. Switch sides.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you lift, inhale as you lower.',
    common_mistakes_en = 'Hips tilting to one side; arching the back; jerking fast.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 129;

UPDATE exercises SET
    instructions_en = '1. Sit with your back supported, place the inside of the pads against your inner thighs, set the opening to a moderate range.
2. Grip the handles.
3. Squeeze your legs together.
4. Open your legs slowly back to the starting position.',
    steps_en = '1. Sit with your back supported, place the inside of the pads against your inner thighs, set the opening to a moderate range.
2. Grip the handles.
3. Squeeze your legs together.
4. Open your legs slowly back to the starting position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you squeeze in, inhale as you open.',
    common_mistakes_en = 'Opening too wide and straining the groin; jerking fast; leaning the torso back.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 130;

UPDATE exercises SET
    instructions_en = '1. Sit with your back supported, the outside of your thighs against the pads.
2. Grip the handles.
3. Open both legs out to the sides.
4. Close slowly back to the starting position.',
    steps_en = '1. Sit with your back supported, the outside of your thighs against the pads.
2. Grip the handles.
3. Open both legs out to the sides.
4. Close slowly back to the starting position.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you open, inhale as you close.',
    common_mistakes_en = 'Letting the weight stack slam; leaning back; jerking fast.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 131;

UPDATE exercises SET
    instructions_en = '1. Sit down, place the front half of your feet on the step, pad pressed on your thighs near the knees.
2. Release the catch and lower your heels as far as possible.
3. Rise onto your toes as high as you can.
4. Lower slowly.',
    steps_en = '1. Sit down, place the front half of your feet on the step, pad pressed on your thighs near the knees.
2. Release the catch and lower your heels as far as possible.
3. Rise onto your toes as high as you can.
4. Lower slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you rise, inhale as you lower.',
    common_mistakes_en = 'Bouncing; short range of motion; pushing with your hands.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 132;

UPDATE exercises SET
    instructions_en = '1. Sit on the leg press, place the front half of your feet on the lower edge of the platform.
2. Extend your legs to nearly straight, DO NOT release the safety catch.
3. Push the platform with your toes.
4. Release slowly.',
    steps_en = '1. Sit on the leg press, place the front half of your feet on the lower edge of the platform.
2. Extend your legs to nearly straight, DO NOT release the safety catch.
3. Push the platform with your toes.
4. Release slowly.',
    setup_position_en = NULL,
    breathing_en = 'Exhale as you push, inhale as you release.',
    common_mistakes_en = 'Releasing the safety catch; feet slipping off the platform; bouncing.',
    safety_notes_en = 'Leave the safety catch engaged; use a moderate weight because your feet can slip. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 133;

UPDATE exercises SET
    instructions_en = '1. Sit or stand tall, chin slightly tucked.
2. Place your palm on your forehead and push gently backward; your neck resists so your head stays still.
3. Hold for a few seconds, then release.
4. Repeat with your hand behind your head.',
    steps_en = '1. Sit or stand tall, chin slightly tucked.
2. Place your palm on your forehead and push gently backward; your neck resists so your head stays still.
3. Hold for a few seconds, then release.
4. Repeat with your hand behind your head.',
    setup_position_en = NULL,
    breathing_en = 'Breathe evenly, do not hold your breath.',
    common_mistakes_en = 'Pushing too hard; letting your head be pushed out of position; holding your breath.',
    safety_notes_en = 'Use only light force. People with cervical spine problems should consult a healthcare professional first. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week, to the point where a short rest is needed before repeating. Sets, reps and load are decided by the coach.',
    sets_reps_hint_en = NULL
WHERE id = 134;

UPDATE exercises SET
    instructions_en = '1. Step onto the treadmill, choose a slow speed.
2. Stand tall, hands resting lightly on the handrails.
3. Step with your whole foot onto the belt.
4. Slow down gradually over the last few minutes.',
    steps_en = '1. Step onto the treadmill, choose a slow speed.
2. Stand tall, hands resting lightly on the handrails.
3. Step with your whole foot onto the belt.
4. Slow down gradually over the last few minutes.',
    setup_position_en = NULL,
    breathing_en = 'Breathe evenly; slow down if you cannot say a few sentences.',
    common_mistakes_en = 'Leaning your whole body on the handrails; hunching over; stepping only on your toes.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or daily.',
    sets_reps_hint_en = NULL
WHERE id = 135;

UPDATE exercises SET
    instructions_en = '1. Load the weight onto the sled, grip both handles.
2. Lean your torso forward, arms straight or slightly bent, back straight.
3. Take short, powerful steps to drive the sled forward.
4. Cover the full distance, rest, then repeat.',
    steps_en = '1. Load the weight onto the sled, grip both handles.
2. Lean your torso forward, arms straight or slightly bent, back straight.
3. Take short, powerful steps to drive the sled forward.
4. Cover the full distance, rest, then repeat.',
    setup_position_en = NULL,
    breathing_en = 'Breathe evenly, do not hold your breath throughout the push.',
    common_mistakes_en = 'Rounding the back; steps too long; looking down at your feet.',
    safety_notes_en = 'Check that the path is clear. Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or daily.',
    sets_reps_hint_en = NULL
WHERE id = 136;

UPDATE exercises SET
    instructions_en = '1. Stand with feet shoulder-width apart, knees bent, holding both ends of the ropes.
2. Back straight, chest open.
3. Alternate your arms up and down to create a continuous wave.
4. Train in short intervals with rest in between.',
    steps_en = '1. Stand with feet shoulder-width apart, knees bent, holding both ends of the ropes.
2. Back straight, chest open.
3. Alternate your arms up and down to create a continuous wave.
4. Train in short intervals with rest in between.',
    setup_position_en = NULL,
    breathing_en = 'Breathe evenly in rhythm with the waves.',
    common_mistakes_en = 'Standing with straight knees; rounding the back; swinging only from the wrists.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or daily.',
    sets_reps_hint_en = NULL
WHERE id = 137;

UPDATE exercises SET
    instructions_en = '1. Adjust the seat so that at the farthest point of the pedal stroke your knee is still slightly bent.
2. Sit back and strap your feet into the pedals.
3. Pedal steadily, increasing resistance gradually.
4. Reduce resistance over the last few minutes.',
    steps_en = '1. Adjust the seat so that at the farthest point of the pedal stroke your knee is still slightly bent.
2. Sit back and strap your feet into the pedals.
3. Pedal steadily, increasing resistance gradually.
4. Reduce resistance over the last few minutes.',
    setup_position_en = NULL,
    breathing_en = 'Breathe evenly; if you can still talk, that is moderate intensity.',
    common_mistakes_en = 'Seat too far away so the knees lock out; resistance too light; shoulders tensing while pedaling.',
    safety_notes_en = 'Stop exercising immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, who are pregnant or postpartum should consult a healthcare professional before training.',
    suggested_dose_en = 'Counts toward the weekly target for adults 19–64: at least 150 minutes of moderate intensity or 75 minutes of vigorous intensity, spread over 4–5 days or daily.',
    sets_reps_hint_en = NULL
WHERE id = 138;

UPDATE exercises SET
    instructions_en = '1. Use both hands on the floor to lift your hips slightly off the ground so your weight shifts onto your calves.
2. Roll slowly along the calf from above the heel up to below the back of the knee.
3. When you find a particularly tight spot, hold there for 20–30 seconds and breathe deeply.
4. Switch legs and repeat.',
    steps_en = '1. Use both hands on the floor to lift your hips slightly off the ground so your weight shifts onto your calves.
2. Roll slowly along the calf from above the heel up to below the back of the knee.
3. When you find a particularly tight spot, hold there for 20–30 seconds and breathe deeply.
4. Switch legs and repeat.',
    setup_position_en = 'Sit on the mat with your legs extended in front. Place the foam roller perpendicular just below the calf of one or both legs, hands planted firmly behind your hips.',
    breathing_en = 'Breathe evenly and slowly; avoid holding your breath when the roller presses on a tender point.',
    common_mistakes_en = 'Rolling too fast past the tight spot; rolling directly over the back of the knee; tensing the neck and shoulders while supporting yourself.',
    safety_notes_en = 'Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. People with a history of spine or joint injury should consult a doctor or coach before doing this.',
    suggested_dose_en = 'Roll 30–60 seconds per leg after training or on recovery days.',
    sets_reps_hint_en = '30–60 sec/side'
WHERE id = 139;

UPDATE exercises SET
    instructions_en = '1. Use both hands on the floor to lift your glutes about 5–10 cm off the floor.
2. Roll slowly forward and back so the roller moves from just above the knee joint to close to the glutes.
3. Pause and breathe deeply in the areas where the muscles are tightest.
4. Do this for 45–60 seconds.',
    steps_en = '1. Use both hands on the floor to lift your glutes about 5–10 cm off the floor.
2. Roll slowly forward and back so the roller moves from just above the knee joint to close to the glutes.
3. Pause and breathe deeply in the areas where the muscles are tightest.
4. Do this for 45–60 seconds.',
    setup_position_en = 'Sit on the floor with your hands supporting behind your back. Place the foam roller just under your hamstrings, legs extended naturally.',
    breathing_en = 'Keep a natural breathing rhythm and relax the whole hamstring group while rolling.',
    common_mistakes_en = 'Driving force straight into the back of the knee joint; rounding the back and craning the neck; placing your hands too far back and tiring the shoulders.',
    safety_notes_en = 'Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. People with a history of spine or joint injury should consult a doctor or coach before doing this.',
    suggested_dose_en = 'Roll 45–60 seconds per leg after leg-training or running sessions.',
    sets_reps_hint_en = '45–60 sec/side'
WHERE id = 140;

UPDATE exercises SET
    instructions_en = '1. Keep both feet firmly on the floor and use your legs to move your body gently over the roller.
2. Roll only over a short range on the muscle padding beside the lower back; never press directly on the bare vertebrae.
3. Roll gently for about 30–45 seconds on each side of the body.',
    steps_en = '1. Keep both feet firmly on the floor and use your legs to move your body gently over the roller.
2. Roll only over a short range on the muscle padding beside the lower back; never press directly on the bare vertebrae.
3. Roll gently for about 30–45 seconds on each side of the body.',
    setup_position_en = 'Lie face up on the mat with knees bent and feet flat on the floor. Place the foam roller under your lower back, but angle your body slightly to one side so it rolls over the muscle beside the spine.',
    breathing_en = 'Inhale gently through the nose and exhale slowly through the mouth, keeping the body as relaxed as possible.',
    common_mistakes_en = 'Pressing the roller straight down the middle of the lumbar vertebrae with no muscle padding; over-arching the lower back; rolling too hard.',
    safety_notes_en = 'People with acute disc herniation should not self-roll the lower back without medical clearance. Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = 'Roll 30–45 seconds per side at a very slow, controlled pace.',
    sets_reps_hint_en = '30–45 seconds/side'
WHERE id = 141;

UPDATE exercises SET
    instructions_en = '1. Take a deep breath and keep both elbows pinned close to your sides against the ribcage.
2. Contract the biceps and curl the bar up in an arc toward the upper chest.
3. Squeeze the biceps hard at the top for 1 second.
4. Exhale and slowly lower the bar back to the start over 2–3 seconds.',
    steps_en = '1. Take a deep breath and keep both elbows pinned close to your sides against the ribcage.
2. Contract the biceps and curl the bar up in an arc toward the upper chest.
3. Squeeze the biceps hard at the top for 1 second.
4. Exhale and slowly lower the bar back to the start over 2–3 seconds.',
    setup_position_en = 'Stand tall with feet shoulder-width apart for a stable stance. Hold an EZ bar at the angled grips facing inward, arms extended straight down in front of the thighs, palms facing forward.',
    breathing_en = 'Inhale at the start and as you lower the bar; exhale sharply as you curl the weight to the top.',
    common_mistakes_en = 'Swinging the torso for momentum; letting the elbows drift too far forward; letting the wrists bend and become unstable.',
    safety_notes_en = 'Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = 'General suggestion: 3 sets x 10–12 reps per session, resting 60–90 seconds between sets. Load is adjusted by the trainer to suit your condition.',
    sets_reps_hint_en = '3 sets x 10–12 reps'
WHERE id = 142;

UPDATE exercises SET
    instructions_en = '1. Fix the upper arms at a slight incline toward the head, about 5–10 degrees, to maintain constant tension.
2. Slowly bend the elbows, lowering the bar in an arc down to just above the forehead or the top of the head.
3. Feel the triceps stretch fully at the bottom.
4. Drive the bar back to the start using the triceps and squeeze the triceps.',
    steps_en = '1. Fix the upper arms at a slight incline toward the head, about 5–10 degrees, to maintain constant tension.
2. Slowly bend the elbows, lowering the bar in an arc down to just above the forehead or the top of the head.
3. Feel the triceps stretch fully at the bottom.
4. Drive the bar back to the start using the triceps and squeeze the triceps.',
    setup_position_en = 'Lie face up with your back flat on a flat bench and both feet firmly on the floor. Grip the EZ bar at the narrow inner grips, press it straight up over the chest, with elbows slightly tucked.',
    breathing_en = 'Inhale as you lower the bar toward the forehead; exhale forcefully as you extend the arms and press up.',
    common_mistakes_en = 'Flaring the elbows out to the sides; moving the whole arm and losing isolation; letting the weight drop freely toward the forehead.',
    safety_notes_en = 'A spotter is mandatory, or use a manageable weight to avoid dropping the bar on your face. Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = 'General suggestion: 3 sets x 10–12 reps per session, resting 60–90 seconds between sets. Load is adjusted by the trainer to suit your condition.',
    sets_reps_hint_en = '3 sets x 8–10 reps'
WHERE id = 143;

UPDATE exercises SET
    instructions_en = '1. Clamp your fingers firmly onto the face of the plate and tense the forearms.
2. Lift the plate to thigh level using your strength, keeping the torso upright and balanced.
3. Hold the pinch for about 20–45 seconds, or until the fingers start to slip from fatigue.
4. Set the plate down gently and switch sides if training one arm at a time.',
    steps_en = '1. Clamp your fingers firmly onto the face of the plate and tense the forearms.
2. Lift the plate to thigh level using your strength, keeping the torso upright and balanced.
3. Hold the pinch for about 20–45 seconds, or until the fingers start to slip from fatigue.
4. Set the plate down gently and switch sides if training one arm at a time.',
    setup_position_en = 'Stand upright next to a plate set on edge. Place your thumb on one side and the remaining fingers on the opposite side of the plate.',
    breathing_en = 'Keep breathing steady and natural throughout the hold.',
    common_mistakes_en = 'Pinching with the fingernails instead of the finger pads; rounding the back while holding the plate; dropping the plate onto your foot.',
    safety_notes_en = 'Stand well back from your toes so a slipping plate cannot land on your foot. Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = '3–4 sets, holding 20–40 seconds per set.',
    sets_reps_hint_en = '3–4 sets x 30 seconds'
WHERE id = 144;

UPDATE exercises SET
    instructions_en = '1. Take a small step back into the center of the machine, stand stable, and keep a slight bend in the elbows.
2. Open both arms out to the sides and back along a wide arc at chest height.
3. Squeeze the rear delts hard at the end of the movement for 1 second.
4. Slowly bring the hands back together to the starting crossed position.',
    steps_en = '1. Take a small step back into the center of the machine, stand stable, and keep a slight bend in the elbows.
2. Open both arms out to the sides and back along a wide arc at chest height.
3. Squeeze the rear delts hard at the end of the movement for 1 second.
4. Slowly bring the hands back together to the starting crossed position.',
    setup_position_en = 'Set both cable pulleys at eye level or shoulder height. No handles needed — grip the ball ends of the cables directly: right hand takes the left cable, left hand takes the right cable.',
    breathing_en = 'Exhale as you open the arms back; inhale as you return the hands forward.',
    common_mistakes_en = 'Shrugging the shoulders up toward the ears; arching the chest and jerking the torso backward for momentum; locking the elbows out hard.',
    safety_notes_en = 'Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = 'General suggestion: 3 sets x 10–12 reps per session, resting 60–90 seconds between sets. Load is adjusted by the trainer to suit your condition.',
    sets_reps_hint_en = '3 sets x 12–15 reps'
WHERE id = 145;

UPDATE exercises SET
    instructions_en = '1. Place your palm on your forehead. Gently press your head backward with your hand while lightly tensing the neck to keep the head still.
2. Maintain steady resistance for 8–10 seconds.
3. Move the hand to the back of the head, press forward, and hold the neck static for 8–10 seconds.
4. Repeat the same on both temples (left and right).',
    steps_en = '1. Place your palm on your forehead. Gently press your head backward with your hand while lightly tensing the neck to keep the head still.
2. Maintain steady resistance for 8–10 seconds.
3. Move the hand to the back of the head, press forward, and hold the neck static for 8–10 seconds.
4. Repeat the same on both temples (left and right).',
    setup_position_en = 'Sit upright in a backed chair or stand tall, with the head and gaze straight ahead and shoulders relaxed.',
    breathing_en = 'Breathe gently and evenly; never hold your breath while bracing.',
    common_mistakes_en = 'Pressing too hard with the hand and causing neck pain; twisting the neck to the side instead of holding it static.',
    safety_notes_en = 'People with severe cervical spine degeneration or acute neck pain should consult a specialist before training. Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = 'Hold each direction 8–10 seconds, repeating for 3–4 rounds.',
    sets_reps_hint_en = '3 rounds x 10 seconds/direction'
WHERE id = 146;

UPDATE exercises SET
    instructions_en = '1. Insert the pin at a moderate weight, brace the abs, and grip the handles at the sides of the seat.
2. Drive both leg pads apart as far as possible using the glutes and outer hips.
3. Pause at the widest point for 1 second to feel the squeeze.
4. Slowly bring the legs back together to the start over 2–3 seconds.',
    steps_en = '1. Insert the pin at a moderate weight, brace the abs, and grip the handles at the sides of the seat.
2. Drive both leg pads apart as far as possible using the glutes and outer hips.
3. Pause at the widest point for 1 second to feel the squeeze.
4. Slowly bring the legs back together to the start over 2–3 seconds.',
    setup_position_en = 'Sit with your back against the back pad of the hip abduction machine and both feet on the foot pads. Adjust the pads so they contact the outside of the knees.',
    breathing_en = 'Exhale as you spread the legs out; inhale as you slowly bring them back together.',
    common_mistakes_en = 'Using momentum to jerk the legs open; lifting the hips off the seat; letting the weight stack slam between reps.',
    safety_notes_en = 'Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = 'General suggestion: 3 sets x 10–12 reps per session, resting 60–90 seconds between sets. Load is adjusted by the trainer to suit your condition.',
    sets_reps_hint_en = '3 sets x 15–20 reps'
WHERE id = 147;

UPDATE exercises SET
    instructions_en = '1. Grip the handles at the sides of the seat to stabilize your torso.
2. Activate the inner thigh muscles and squeeze the knees together until the pads touch.
3. Hold the inner-thigh squeeze for 1 count at the midpoint.
4. Resist the pull and return the legs slowly to the starting position.',
    steps_en = '1. Grip the handles at the sides of the seat to stabilize your torso.
2. Activate the inner thigh muscles and squeeze the knees together until the pads touch.
3. Hold the inner-thigh squeeze for 1 count at the midpoint.
4. Resist the pull and return the legs slowly to the starting position.',
    setup_position_en = 'Sit upright on the machine seat with your head and back against the pad. Adjust the pads to turn inward against the inside of the knees, and set the machine to a comfortable starting angle.',
    breathing_en = 'Exhale as you squeeze the thighs together; inhale as you open the legs.',
    common_mistakes_en = 'Opening the legs beyond your flexibility and straining the groin; letting the legs snap back on the return.',
    safety_notes_en = 'Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = 'General suggestion: 3 sets x 10–12 reps per session, resting 60–90 seconds between sets. Load is adjusted by the trainer to suit your condition.',
    sets_reps_hint_en = '3 sets x 12–15 reps'
WHERE id = 148;

UPDATE exercises SET
    instructions_en = '1. Keep the elbows straight and the neck in a neutral position, eyes looking forward.
2. Use the traps to shrug both shoulder blades straight up as high as possible toward the ears.
3. Squeeze the traps hard at the top for 1–2 seconds.
4. Lower the shoulders slowly through the full range so the traps stretch completely.',
    steps_en = '1. Keep the elbows straight and the neck in a neutral position, eyes looking forward.
2. Use the traps to shrug both shoulder blades straight up as high as possible toward the ears.
3. Squeeze the traps hard at the top for 1–2 seconds.
4. Lower the shoulders slowly through the full range so the traps stretch completely.',
    setup_position_en = 'Stand tall with feet hip-width apart. Hold the bar across the thighs with hands shoulder-width apart, palms facing the body, arms hanging fully straight.',
    breathing_en = 'Exhale as you shrug up; inhale deeply as you lower the shoulders.',
    common_mistakes_en = 'Rolling the shoulders in circles while shrugging (very risky for the shoulder capsule); bending the elbows to pull the bar; tilting the head too far up or down.',
    safety_notes_en = 'Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = 'General suggestion: 3 sets x 10–12 reps per session, resting 60–90 seconds between sets. Load is adjusted by the trainer to suit your condition.',
    sets_reps_hint_en = '3–4 sets x 10–12 reps'
WHERE id = 149;

UPDATE exercises SET
    instructions_en = '1. Brace the abs and gently press the lower back down into the floor.
2. Curl the upper back and shoulder blades about 30 degrees off the floor, bringing the weight plate toward the knees.
3. Squeeze the abs hard at the top for 1 second.
4. Lower the torso slowly back to the floor without fully relaxing the abs.',
    steps_en = '1. Brace the abs and gently press the lower back down into the floor.
2. Curl the upper back and shoulder blades about 30 degrees off the floor, bringing the weight plate toward the knees.
3. Squeeze the abs hard at the top for 1 second.
4. Lower the torso slowly back to the floor without fully relaxing the abs.',
    setup_position_en = 'Lie face up on the mat with knees bent 90 degrees and both feet flat on the floor. Hold the weight plate firmly with both hands directly in front of the sternum.',
    breathing_en = 'Exhale forcefully as you curl up; inhale deeply as you lower back down.',
    common_mistakes_en = 'Yanking the plate forward with the arms; using neck momentum instead of the abs; lifting the entire lower back off the floor.',
    safety_notes_en = 'Stop immediately if you feel sharp pain, dizziness, or unusual shortness of breath. Anyone with a history of spinal or joint injury should consult a doctor or trainer before performing this.',
    suggested_dose_en = 'General suggestion: 3 sets x 10–12 reps per session, resting 60–90 seconds between sets. Load is adjusted by the trainer to suit your condition.',
    sets_reps_hint_en = '3 sets x 12–15 reps'
WHERE id = 150;

UPDATE exercises SET
    instructions_en = '1. Interlace the fingers of both hands in front of your chest.
2. Lift your right heel and pivot on the ball of the right foot.
3. Circle the wrists while rotating the right ankle clockwise for 10–15 circles.
4. Reverse direction for another 10–15 circles.
5. Switch to the left ankle and repeat the same.',
    steps_en = '1. Interlace the fingers of both hands in front of your chest.
2. Lift your right heel and pivot on the ball of the right foot.
3. Circle the wrists while rotating the right ankle clockwise for 10–15 circles.
4. Reverse direction for another 10–15 circles.
5. Switch to the left ankle and repeat the same.',
    setup_position_en = 'Stand tall with feet shoulder-width apart and the body relaxed.',
    breathing_en = 'Breathe steadily and naturally with the rotation rhythm.',
    common_mistakes_en = 'Rotating too fast and jerking; forcing the joint past its range; tensing the neck and shoulders while rotating.',
    safety_notes_en = 'Do not rotate forcefully if you have an ankle injury or wrist tendinitis.',
    suggested_dose_en = '2 sets, 15–20 circles per side in each direction.',
    sets_reps_hint_en = '15–20 circles/side'
WHERE id = 151;

UPDATE exercises SET
    instructions_en = '1. Start drawing small circles with both arms moving forward.
2. Gradually increase the circle diameter until you reach the full shoulder range of motion.
3. Do 15–20 circles forward.
4. Reverse the direction from back to front for another 15–20 circles.',
    steps_en = '1. Start drawing small circles with both arms moving forward.
2. Gradually increase the circle diameter until you reach the full shoulder range of motion.
3. Do 15–20 circles forward.
4. Reverse the direction from back to front for another 15–20 circles.',
    setup_position_en = 'Stand tall with feet shoulder-width apart and both arms out to the sides in a straight line parallel to the floor.',
    breathing_en = 'Inhale deeply as the arms open back; exhale gently as the arms circle forward.',
    common_mistakes_en = 'Shrugging and pulling the head down while circling; over-arching the lower back; circling too fast and losing shoulder control.',
    safety_notes_en = 'If you hear grinding along with sharp shoulder pain, reduce the circle size or stop.',
    suggested_dose_en = '2 sets x 15–20 circles per direction.',
    sets_reps_hint_en = '15–20 circles/direction'
WHERE id = 152;

UPDATE exercises SET
    instructions_en = '1. Push the hips gently to the right, then forward to lightly stretch the front of the thighs.
2. Continue pushing the hips to the left, then the glutes back to lightly stretch the hamstrings.
3. Complete one smooth circular rotation.
4. Repeat for 10–12 circles clockwise, then reverse direction.',
    steps_en = '1. Push the hips gently to the right, then forward to lightly stretch the front of the thighs.
2. Continue pushing the hips to the left, then the glutes back to lightly stretch the hamstrings.
3. Complete one smooth circular rotation.
4. Repeat for 10–12 circles clockwise, then reverse direction.',
    setup_position_en = 'Stand tall with feet shoulder-width apart and both hands resting on the sides of the hips.',
    breathing_en = 'Breathe smoothly in rhythm with the circular hip movement.',
    common_mistakes_en = 'Only swinging the knees instead of rotating the hip joint; bending the back too far; sudden jerky rotations.',
    safety_notes_en = 'Keep the feet flat on the floor throughout the hip rotation.',
    suggested_dose_en = '2 sets x 10–12 circles/direction.',
    sets_reps_hint_en = '10–12 circles/direction'
WHERE id = 153;

UPDATE exercises SET
    instructions_en = '1. Use your hands to guide both knees gently in circles to the right, forward, left, and back.
2. Perform 10–15 circles clockwise.
3. Reverse direction for another 10–15 circles counterclockwise.',
    steps_en = '1. Use your hands to guide both knees gently in circles to the right, forward, left, and back.
2. Perform 10–15 circles clockwise.
3. Reverse direction for another 10–15 circles counterclockwise.',
    setup_position_en = 'Stand with feet close together and knees slightly bent about 20–30 degrees; place both palms lightly on the kneecaps.',
    breathing_en = 'Breathe steadily and naturally.',
    common_mistakes_en = 'Pressing the knees hard together; bending the knees too deep and loading the joint cartilage; jerky rotations.',
    safety_notes_en = 'People with a history of ligament tears or knee degeneration should circle only through a small, gentle range.',
    suggested_dose_en = '2 sets x 10–15 circles per direction.',
    sets_reps_hint_en = '10–15 circles/direction'
WHERE id = 154;

UPDATE exercises SET
    instructions_en = '1. Actively swing both arms back in rhythm until you feel a moderate chest stretch.
2. Bring the arms forward and cross them over the chest (one arm over the other) to stretch the upper back.
3. Repeat continuously at a smooth tempo, alternating which arm is on top each rep.',
    steps_en = '1. Actively swing both arms back in rhythm until you feel a moderate chest stretch.
2. Bring the arms forward and cross them over the chest (one arm over the other) to stretch the upper back.
3. Repeat continuously at a smooth tempo, alternating which arm is on top each rep.',
    setup_position_en = 'Stand tall with the chest slightly lifted and both arms out at chest height with a slight bend in the elbows.',
    breathing_en = 'Inhale deeply as you swing the arms open; exhale sharply as you cross them in front of the chest.',
    common_mistakes_en = 'Rounding the back while hugging the torso; swinging the arms too hard and causing sharp shoulder strain.',
    safety_notes_en = 'Keep the torso stable — do not sway or rock the upper body.',
    suggested_dose_en = '2 sets x 12–15 reps.',
    sets_reps_hint_en = '12–15 reps'
WHERE id = 155;

UPDATE exercises SET
    instructions_en = '1. Lightly brace the abs to lock the pelvis and press both heels into the floor.
2. Squeeze the glutes hard and drive the pelvis straight up until the thighs and torso form a straight line.
3. Hold the glute contraction at the top for 2 seconds.
4. Lower the hips under control to lightly touch the floor, then continue with the next rep.',
    steps_en = '1. Lightly brace the abs to lock the pelvis and press both heels into the floor.
2. Squeeze the glutes hard and drive the pelvis straight up until the thighs and torso form a straight line.
3. Hold the glute contraction at the top for 2 seconds.
4. Lower the hips under control to lightly touch the floor, then continue with the next rep.',
    setup_position_en = 'Lie face up on the mat with knees bent so the heels are about a hand''s length from the glutes, arms at your sides.',
    breathing_en = 'Exhale as you drive the hips up; inhale as you lower them.',
    common_mistakes_en = 'Arching the lower back to lift the hips instead of using the glutes; lifting the toes or letting the knees splay out.',
    safety_notes_en = 'Focus on feeling 100% of the squeeze from both glutes.',
    suggested_dose_en = '2–3 sets x 12–15 reps, holding 2 seconds at the top.',
    sets_reps_hint_en = '12–15 reps (hold 2s)'
WHERE id = 156;

UPDATE exercises SET
    instructions_en = '1. With a slight knee bend, hop lightly and spread the feet wider than shoulder width.
2. At the same time, swing both arms in an arc overhead until they nearly meet.
3. On the second hop, bring the feet back together and lower the arms to the sides.
4. Continue rhythmically, landing softly on the forefoot.',
    steps_en = '1. With a slight knee bend, hop lightly and spread the feet wider than shoulder width.
2. At the same time, swing both arms in an arc overhead until they nearly meet.
3. On the second hop, bring the feet back together and lower the arms to the sides.
4. Continue rhythmically, landing softly on the forefoot.',
    setup_position_en = 'Stand tall with feet close together and arms down at your sides.',
    breathing_en = 'Breathe steadily with the 1-2 jump rhythm.',
    common_mistakes_en = 'Landing hard on the whole heel and jarring the knees; holding your breath while jumping.',
    safety_notes_en = 'People with knee pain can substitute non-jumping Step Jacks.',
    suggested_dose_en = '2 sets x 30–45 seconds.',
    sets_reps_hint_en = '30–45 seconds'
WHERE id = 157;

UPDATE exercises SET
    instructions_en = '1. Step onto the treadmill and walk to warm up for 2 minutes.
2. Gradually increase to your target steady-run pace (e.g., 7.5–9.5 km/h) and set the incline to 1–2% to offset wind resistance.
3. Maintain an upright running posture, land on the forefoot, and swing the arms smoothly at 90 degrees.
4. To finish, gradually reduce speed to 3.5 km/h and walk to cool down for 2–3 minutes before stopping the machine.',
    steps_en = '1. Step onto the treadmill and walk to warm up for 2 minutes.
2. Gradually increase to your target steady-run pace (e.g., 7.5–9.5 km/h) and set the incline to 1–2% to offset wind resistance.
3. Maintain an upright running posture, land on the forefoot, and swing the arms smoothly at 90 degrees.
4. To finish, gradually reduce speed to 3.5 km/h and walk to cool down for 2–3 minutes before stopping the machine.',
    setup_position_en = 'Stand on the side rails of the treadmill and clip the safety key to your clothing. Start the machine at a walking speed of 3–4 km/h.',
    breathing_en = 'Inhale deeply through the nose over 2 running steps and exhale through the mouth over 2 steps, evenly.',
    common_mistakes_en = 'Holding the handrails while running; overstriding and landing on the heel; looking down at your feet and tiring the neck.',
    safety_notes_en = 'Always clip on the safety key so the machine stops automatically if you trip.',
    suggested_dose_en = '20–30 minutes of continuous running in heart rate Zone 2/3.',
    sets_reps_hint_en = '20–30 minutes'
WHERE id = 158;

UPDATE exercises SET
    instructions_en = '1. Start at 0% incline and 4 km/h for 2 minutes.
2. Raise the incline to 8–12% and set the speed to 4.5–5.2 km/h.
3. Take firm steps, leaning the torso slightly forward to match the incline, with natural arm swing.
4. Keep your heart rate at 60–70% of maximum.',
    steps_en = '1. Start at 0% incline and 4 km/h for 2 minutes.
2. Raise the incline to 8–12% and set the speed to 4.5–5.2 km/h.
3. Take firm steps, leaning the torso slightly forward to match the incline, with natural arm swing.
4. Keep your heart rate at 60–70% of maximum.',
    setup_position_en = 'Clip the safety key to your shirt, stand on the treadmill belt, and press start.',
    breathing_en = 'Breathe deeply and evenly through the nose and mouth.',
    common_mistakes_en = 'Gripping the console with both hands and pulling yourself backward, which cancels the incline effect; taking overly long strides.',
    safety_notes_en = 'Focus on your foot placement so you do not slip off the back of the belt.',
    suggested_dose_en = '25–40 minutes per session.',
    sets_reps_hint_en = '25–40 minutes'
WHERE id = 159;

UPDATE exercises SET
    instructions_en = '1. Start pedaling gently at resistance level 2–3 for 3 minutes.
2. Increase resistance to level 5–8 and hold a steady cadence of 75–85 rpm.
3. Keep the torso upright or slightly forward, shoulders relaxed, and elbows not locked stiff.
4. Reduce resistance and pedal slowly to cool down for the last 2 minutes.',
    steps_en = '1. Start pedaling gently at resistance level 2–3 for 3 minutes.
2. Increase resistance to level 5–8 and hold a steady cadence of 75–85 rpm.
3. Keep the torso upright or slightly forward, shoulders relaxed, and elbows not locked stiff.
4. Reduce resistance and pedal slowly to cool down for the last 2 minutes.',
    setup_position_en = 'Adjust the saddle to hip-crest height when standing next to the bike. Sit on the bike and put your feet into the pedal straps.',
    breathing_en = 'Maintain deep, steady breathing in rhythm with your pedal stroke.',
    common_mistakes_en = 'Setting the seat too low so the knees bend sharply and irritate the kneecap cartilage; bouncing the hips off the saddle.',
    safety_notes_en = 'Do not lock the knees when the leg is extended at the bottom of the stroke.',
    suggested_dose_en = '20–35 minutes.',
    sets_reps_hint_en = '20–35 minutes'
WHERE id = 160;

UPDATE exercises SET
    instructions_en = '1. Stand tall with your elbows tucked close to your sides and hands at hip level.
2. Rotate mainly from the wrists to swing the rope in a smooth arc.
3. Jump lightly, only about 2–3 cm off the floor, just enough for the rope to pass under.
4. Land softly on the balls of your feet with knees slightly bent to absorb the impact.',
    steps_en = '1. Stand tall with your elbows tucked close to your sides and hands at hip level.
2. Rotate mainly from the wrists to swing the rope in a smooth arc.
3. Jump lightly, only about 2–3 cm off the floor, just enough for the rope to pass under.
4. Land softly on the balls of your feet with knees slightly bent to absorb the impact.',
    setup_position_en = 'Measure the rope length: step on the middle of the rope with one foot and pull the handles up to chest height — that is the right length.',
    breathing_en = 'Breathe steadily, one cycle every 2–3 jumps.',
    common_mistakes_en = 'Jumping too high and wasting energy; swinging with the whole arm and shoulder instead of the wrists; landing on the heels.',
    safety_notes_en = 'Choose a wooden floor or a sprung exercise mat; do not jump rope directly on hard concrete without shoes.',
    suggested_dose_en = '3–5 sets x 2–3 min jumping, 60s rest between sets',
    sets_reps_hint_en = '2–3 min/set'
WHERE id = 161;

UPDATE exercises SET
    instructions_en = '1. Catch: Slide forward with knees bent, arms extended and gripping the handle firmly, back straight.
2. Drive: Push hard through both heels to extend the legs (60% of the power), lean the torso slightly back to an 11 o''clock angle (20% of the power), pull the handle to just below the sternum (20% of the power).
3. Finish: Keep the legs extended, elbows pulled back, chest open.
4. Recovery: Straighten the arms → hinge at the hips to a 1 o''clock angle → bend the knees and slide gently back to the starting position.',
    steps_en = '1. Catch: Slide forward with knees bent, arms extended and gripping the handle firmly, back straight.
2. Drive: Push hard through both heels to extend the legs (60% of the power), lean the torso slightly back to an 11 o''clock angle (20% of the power), pull the handle to just below the sternum (20% of the power).
3. Finish: Keep the legs extended, elbows pulled back, chest open.
4. Recovery: Straighten the arms → hinge at the hips to a 1 o''clock angle → bend the knees and slide gently back to the starting position.',
    setup_position_en = 'Sit on the sliding seat, place your feet on the footplates and tighten the straps. Set the damper to 4–6.',
    breathing_en = 'Exhale sharply as you drive with the legs and pull the handle back; inhale deeply as you slide forward.',
    common_mistakes_en = 'Pulling with the arms before driving with the legs; rounding the spine; pulling the handle up too high toward the throat.',
    safety_notes_en = 'Always keep your back straight and your core braced throughout the pull.',
    suggested_dose_en = '15–25 min or 4–5 sets x 500 m',
    sets_reps_hint_en = '15–25 min'
WHERE id = 162;

UPDATE exercises SET
    instructions_en = '1. Take smooth, steady steps, driving your weight through the heel to engage the glutes.
2. Let your arms hang loosely or rest them lightly on the handrails only for balance; do not load your weight onto your hands.
3. Gradually increase the speed to Level 6–9 depending on your fitness.
4. Keep your back straight and do not drop your head or round your back.',
    steps_en = '1. Take smooth, steady steps, driving your weight through the heel to engage the glutes.
2. Let your arms hang loosely or rest them lightly on the handrails only for balance; do not load your weight onto your hands.
3. Gradually increase the speed to Level 6–9 depending on your fitness.
4. Keep your back straight and do not drop your head or round your back.',
    setup_position_en = 'Start the machine at a slow speed (Level 3–4) and place both feet fully on the steps.',
    breathing_en = 'Keep your breathing deep and steady with each step.',
    common_mistakes_en = 'Leaning your entire body weight on the handrails to relieve tired legs; stepping on your toes; skipping a step before you are stable.',
    safety_notes_en = 'If you feel fatigued or exhausted, press Stop to slow down gradually; do not jump off the machine suddenly.',
    suggested_dose_en = '15–25 min',
    sets_reps_hint_en = '15–25 min'
WHERE id = 163;

UPDATE exercises SET
    instructions_en = '1. 40 seconds Burpees: Stand tall → squat down with your hands on the floor → jump your feet back into a plank → one push-up → jump your feet forward → jump high and clap overhead.
2. Rest 20 seconds, walk around and breathe deeply.
3. 40 seconds Mountain Climbers: Set up in a high plank → drive your knees alternately toward your chest as fast as you can.
4. Rest 20 seconds. Repeat the cycle for 4–6 rounds.',
    steps_en = '1. 40 seconds Burpees: Stand tall → squat down with your hands on the floor → jump your feet back into a plank → one push-up → jump your feet forward → jump high and clap overhead.
2. Rest 20 seconds, walk around and breathe deeply.
3. 40 seconds Mountain Climbers: Set up in a high plank → drive your knees alternately toward your chest as fast as you can.
4. Rest 20 seconds. Repeat the cycle for 4–6 rounds.',
    setup_position_en = 'Set up a mat on an open floor and wear athletic shoes with good grip.',
    breathing_en = 'Exhale forcefully through your mouth when you exert; inhale deeply through your nose during the 20-second rest.',
    common_mistakes_en = 'Sagging the lower back when you kick your legs back in the burpee; piking your hips too high during mountain climbers; holding your breath.',
    safety_notes_en = 'People with a history of high blood pressure or cardiovascular disease should not do this exercise at maximum intensity.',
    suggested_dose_en = '4–6 rounds (12–18 min total)',
    sets_reps_hint_en = '40s work / 20s rest x 4–6 rounds'
WHERE id = 164;

-- 3. Bản dịch biến thể bài tập

UPDATE exercises SET variations_en = 'Dumbbell bench press; incline bench press; push-ups for those new to weights.' WHERE id = 1;
UPDATE exercises SET variations_en = 'Incline barbell bench press; flat dumbbell bench press.' WHERE id = 2;
UPDATE exercises SET variations_en = 'Wall push-up or hands on a bench (easier); kneeling push-up; feet elevated (harder).' WHERE id = 3;
UPDATE exercises SET variations_en = 'Machine chest fly (pec deck); dumbbell chest press on a bench.' WHERE id = 4;
UPDATE exercises SET variations_en = 'Romanian deadlift; trap bar deadlift; kettlebell deadlift from the floor.' WHERE id = 5;
UPDATE exercises SET variations_en = 'Close-grip lat pulldown; band-assisted pull-up.' WHERE id = 6;
UPDATE exercises SET variations_en = 'One-arm dumbbell row on bench; bent-over barbell row (harder).' WHERE id = 7;
UPDATE exercises SET variations_en = 'Pull-up with band or assisted machine; negatives only; chin-up.' WHERE id = 8;
UPDATE exercises SET variations_en = 'Goblet squat with dumbbell; front squat; shallow squat holding a bench for beginners.' WHERE id = 9;
UPDATE exercises SET variations_en = 'Single-leg leg press; change foot position high or low on the platform.' WHERE id = 10;
UPDATE exercises SET variations_en = 'Dumbbell RDL; single-leg RDL (adds balance work).' WHERE id = 11;
UPDATE exercises SET variations_en = 'Split squat in place; reverse lunge; Bulgarian split squat (rear foot on bench).' WHERE id = 12;
UPDATE exercises SET variations_en = 'Seated dumbbell shoulder press; machine shoulder press.' WHERE id = 13;
UPDATE exercises SET variations_en = 'One-arm cable lateral raise; seated lateral raise.' WHERE id = 14;
UPDATE exercises SET variations_en = 'Band pull-apart; bent-over lateral raise.' WHERE id = 15;
UPDATE exercises SET variations_en = 'Dumbbell curl; hammer curl; band curl.' WHERE id = 16;
UPDATE exercises SET variations_en = 'Overhead triceps extension; bench dip.' WHERE id = 17;
UPDATE exercises SET variations_en = 'Knee plank; side plank; straight-arm plank.' WHERE id = 18;
UPDATE exercises SET variations_en = 'Hanging knee raise; lying leg raise; knee raise with hands on a bench.' WHERE id = 19;
UPDATE exercises SET variations_en = 'Incline walking; fast-slow interval running.' WHERE id = 20;
UPDATE exercises SET variations_en = 'Fast-slow interval cycling; recumbent bike.' WHERE id = 21;
UPDATE exercises SET variations_en = 'Step-in burpee without the jump; bench burpee.' WHERE id = 22;
UPDATE exercises SET variations_en = 'Kettlebell deadlift (learn the basics); one-arm swing.' WHERE id = 23;
UPDATE exercises SET variations_en = 'Arms crossed over the chest (harder).' WHERE id = 24;
UPDATE exercises SET variations_en = 'Back squat or goblet squat once the movement is familiar.' WHERE id = 25;
UPDATE exercises SET variations_en = 'Let go of the support for more difficulty; single-leg calf raise.' WHERE id = 26;
UPDATE exercises SET variations_en = 'Push-ups once strong enough.' WHERE id = 29;
UPDATE exercises SET variations_en = 'Barbell curl at the gym.' WHERE id = 30;
UPDATE exercises SET variations_en = 'Group walking; incline treadmill walking.' WHERE id = 40;
UPDATE exercises SET variations_en = 'Place an exercise ball between your back and the wall for smoother sliding.' WHERE id = 45;
UPDATE exercises SET variations_en = 'Add ankle weights for more difficulty.' WHERE id = 46;
UPDATE exercises SET variations_en = 'Shallow squat holding a bench (easier); back squat once technique is solid.' WHERE id = 48;
UPDATE exercises SET variations_en = 'Walking lunge once balance is good.' WHERE id = 49;
UPDATE exercises SET variations_en = 'Incline dumbbell bench press; machine chest press for beginners.' WHERE id = 50;
UPDATE exercises SET variations_en = 'Dumbbell bench press; push-ups.' WHERE id = 51;
UPDATE exercises SET variations_en = 'Cable chest fly; dumbbell chest press on a bench.' WHERE id = 52;
UPDATE exercises SET variations_en = 'Assisted dip machine; bench dip for beginners.' WHERE id = 53;
UPDATE exercises SET variations_en = 'One-arm dumbbell row; seated cable row.' WHERE id = 54;
UPDATE exercises SET variations_en = 'One-arm cable row; two-arm dumbbell row on an incline bench.' WHERE id = 55;
UPDATE exercises SET variations_en = 'Bend the knees to make it easier; feet on a bench for more difficulty.' WHERE id = 56;
UPDATE exercises SET variations_en = 'Prone back extension on the mat (superman); banded hip hinge.' WHERE id = 57;
UPDATE exercises SET variations_en = 'Bodyweight squat; back squat with barbell.' WHERE id = 58;
UPDATE exercises SET variations_en = 'Split squat in place; forward lunge.' WHERE id = 59;
UPDATE exercises SET variations_en = 'Squat; lunge.' WHERE id = 60;
UPDATE exercises SET variations_en = 'Seated leg curl; Romanian deadlift.' WHERE id = 61;
UPDATE exercises SET variations_en = 'Glute bridge on the floor; single-leg hip thrust.' WHERE id = 62;
UPDATE exercises SET variations_en = 'Seated calf raise; single-leg calf raise.' WHERE id = 63;
UPDATE exercises SET variations_en = 'Machine shoulder press; standing barbell shoulder press.' WHERE id = 64;
UPDATE exercises SET variations_en = 'Face pull; rear delt fly on the reverse pec deck.' WHERE id = 65;
UPDATE exercises SET variations_en = 'Cable front raise; plate raise.' WHERE id = 66;
UPDATE exercises SET variations_en = 'Wrist-rotation dumbbell curl; cable curl.' WHERE id = 67;
UPDATE exercises SET variations_en = 'Cable triceps pressdown; lying triceps extension.' WHERE id = 68;
UPDATE exercises SET variations_en = 'Leg extension only (easier); hold a light weight in your hands (harder).' WHERE id = 69;
UPDATE exercises SET variations_en = 'Knee to the floor (easier); lift the top leg (harder).' WHERE id = 70;
UPDATE exercises SET variations_en = 'Arms only or legs only (easier).' WHERE id = 71;
UPDATE exercises SET variations_en = 'Low-to-high wood chop; rotation with a resistance band.' WHERE id = 72;
UPDATE exercises SET variations_en = 'Light steady rowing to warm up; interval rowing.' WHERE id = 73;
UPDATE exercises SET variations_en = 'Legs only without holding on (harder); reverse pedaling.' WHERE id = 74;
UPDATE exercises SET variations_en = 'Light bounces in place without a rope; alternating-foot jump rope.' WHERE id = 75;
UPDATE exercises SET variations_en = 'Suitcase carry; front rack carry.' WHERE id = 76;
UPDATE exercises SET variations_en = 'Slow step with each leg (easier); hands on a bench.' WHERE id = 77;
UPDATE exercises SET variations_en = 'Incline dumbbell bench press; incline bench press on the Smith machine.' WHERE id = 78;
UPDATE exercises SET variations_en = 'Leaning dip; high-to-low cable chest fly.' WHERE id = 79;
UPDATE exercises SET variations_en = 'Machine chest press; cable chest fly.' WHERE id = 80;
UPDATE exercises SET variations_en = 'Cable chest fly at shoulder height; incline dumbbell bench press.' WHERE id = 81;
UPDATE exercises SET variations_en = 'Wall push-up (easier); floor push-up (harder).' WHERE id = 82;
UPDATE exercises SET variations_en = 'Machine-assisted pull-up; negatives only.' WHERE id = 83;
UPDATE exercises SET variations_en = 'Wide-grip lat pulldown; chin-up.' WHERE id = 84;
UPDATE exercises SET variations_en = 'Straight-arm cable pulldown with rope; lying overhead dumbbell pullover.' WHERE id = 85;
UPDATE exercises SET variations_en = 'Chest-supported T-bar row; one-arm dumbbell row.' WHERE id = 86;
UPDATE exercises SET variations_en = 'Seated cable row; one-arm dumbbell row.' WHERE id = 87;
UPDATE exercises SET variations_en = 'Arms only or legs only (easier); back extension on the Roman chair.' WHERE id = 88;
UPDATE exercises SET variations_en = 'Romanian deadlift; back extension on the Roman chair.' WHERE id = 89;
UPDATE exercises SET variations_en = 'Dumbbell shrug; machine shrug.' WHERE id = 90;
UPDATE exercises SET variations_en = 'Barbell shrug; farmer''s carry.' WHERE id = 91;
UPDATE exercises SET variations_en = 'Cable upright row; dumbbell lateral raise.' WHERE id = 92;
UPDATE exercises SET variations_en = 'Seated dumbbell shoulder press; machine shoulder press.' WHERE id = 93;
UPDATE exercises SET variations_en = 'Seated dumbbell shoulder press; standing barbell shoulder press.' WHERE id = 94;
UPDATE exercises SET variations_en = 'Dumbbell lateral raise; machine lateral raise.' WHERE id = 95;
UPDATE exercises SET variations_en = 'Dumbbell rear delt fly; face pull.' WHERE id = 96;
UPDATE exercises SET variations_en = 'Hammer curl; incline seated curl.' WHERE id = 97;
UPDATE exercises SET variations_en = 'One-arm dumbbell preacher curl; cable preacher curl.' WHERE id = 98;
UPDATE exercises SET variations_en = 'Preacher curl; one-arm cable curl.' WHERE id = 99;
UPDATE exercises SET variations_en = 'Rope hammer curl; dumbbell curl.' WHERE id = 100;
UPDATE exercises SET variations_en = 'Barbell curl; preacher curl.' WHERE id = 101;
UPDATE exercises SET variations_en = 'Lying dumbbell triceps extension; cable triceps pressdown.' WHERE id = 102;
UPDATE exercises SET variations_en = 'Close-grip push-up; dip.' WHERE id = 103;
UPDATE exercises SET variations_en = 'Dip; cable triceps pressdown.' WHERE id = 104;
UPDATE exercises SET variations_en = 'Overhead dumbbell triceps extension; skull crusher.' WHERE id = 105;
UPDATE exercises SET variations_en = 'Straight-bar triceps pressdown; overhead triceps extension.' WHERE id = 106;
UPDATE exercises SET variations_en = 'Reverse wrist curl; plate pinch.' WHERE id = 107;
UPDATE exercises SET variations_en = 'Hammer curl; reverse cable curl.' WHERE id = 108;
UPDATE exercises SET variations_en = 'Farmer''s carry; dead hang on the bar.' WHERE id = 109;
UPDATE exercises SET variations_en = 'Crunch on a ball; cable crunch.' WHERE id = 110;
UPDATE exercises SET variations_en = 'Crunch; machine crunch.' WHERE id = 111;
UPDATE exercises SET variations_en = 'Plank; standing ab wheel rollout (very hard).' WHERE id = 112;
UPDATE exercises SET variations_en = 'Reverse crunch; hanging leg raise.' WHERE id = 113;
UPDATE exercises SET variations_en = 'Lying leg raise; hanging knee raise.' WHERE id = 114;
UPDATE exercises SET variations_en = 'Crunch; Russian twist.' WHERE id = 115;
UPDATE exercises SET variations_en = 'Cable crunch; crunch.' WHERE id = 116;
UPDATE exercises SET variations_en = 'Bicycle crunch; cable torso twist.' WHERE id = 117;
UPDATE exercises SET variations_en = 'Side plank; one-arm suitcase carry.' WHERE id = 118;
UPDATE exercises SET variations_en = 'Kneeling Pallof press; Pallof press with rotation.' WHERE id = 119;
UPDATE exercises SET variations_en = 'Goblet squat; back squat with barbell.' WHERE id = 120;
UPDATE exercises SET variations_en = 'Leg press; Smith machine squat.' WHERE id = 121;
UPDATE exercises SET variations_en = 'Back squat; leg press.' WHERE id = 122;
UPDATE exercises SET variations_en = 'Bodyweight step-up; lunge.' WHERE id = 123;
UPDATE exercises SET variations_en = 'Split squat in place; Bulgarian split squat.' WHERE id = 124;
UPDATE exercises SET variations_en = 'Lying leg curl; Romanian deadlift.' WHERE id = 125;
UPDATE exercises SET variations_en = 'Deadlift; Romanian deadlift.' WHERE id = 126;
UPDATE exercises SET variations_en = 'Barbell Romanian deadlift; good morning.' WHERE id = 127;
UPDATE exercises SET variations_en = 'Single-leg glute bridge; hip thrust.' WHERE id = 128;
UPDATE exercises SET variations_en = 'Two-leg glute bridge (easier); single-leg hip thrust.' WHERE id = 129;
UPDATE exercises SET variations_en = 'Sumo squat; lateral lunge.' WHERE id = 130;
UPDATE exercises SET variations_en = 'Side-lying leg raise; lateral band walk.' WHERE id = 131;
UPDATE exercises SET variations_en = 'Standing calf raise; calf raise on the leg press machine.' WHERE id = 132;
UPDATE exercises SET variations_en = 'Standing calf raise; seated calf raise.' WHERE id = 133;
UPDATE exercises SET variations_en = 'Isometric neck hold on both sides; neck rotation.' WHERE id = 134;
UPDATE exercises SET variations_en = 'Stair climbing; elliptical machine.' WHERE id = 135;
UPDATE exercises SET variations_en = 'Backward sled drag; sprinting.' WHERE id = 136;
UPDATE exercises SET variations_en = 'Both arms at once; battle rope slam.' WHERE id = 137;
UPDATE exercises SET variations_en = 'Stationary bike; elliptical machine.' WHERE id = 138;
UPDATE exercises SET variations_en = 'Roll one leg at a time to increase pressure; gently rotate the toes in and out to roll all sides of the calf.' WHERE id = 139;
UPDATE exercises SET variations_en = 'Cross one leg over the other to add deeper massage pressure.' WHERE id = 140;
UPDATE exercises SET variations_en = 'Roll the glutes and gluteus medius instead to indirectly release lower-back tension.' WHERE id = 141;
UPDATE exercises SET variations_en = 'EZ-bar curl on the preacher bench (preacher curl); close-grip curl.' WHERE id = 142;
UPDATE exercises SET variations_en = 'Perform with dumbbells (dumbbell skullcrusher) or lying on an incline bench.' WHERE id = 143;
UPDATE exercises SET variations_en = 'Pinch two thin plates with the smooth sides facing each other (two-plate pinch) for extra challenge.' WHERE id = 144;
UPDATE exercises SET variations_en = 'Lying dumbbell rear delt fly on an incline bench; rear delt press on the reverse pec deck machine.' WHERE id = 145;
UPDATE exercises SET variations_en = 'Use a small soft ball against the wall instead of your hand.' WHERE id = 146;
UPDATE exercises SET variations_en = 'Band clamshell; lateral band walk.' WHERE id = 147;
UPDATE exercises SET variations_en = 'Side-lying leg adduction; wide-stance sumo squat.' WHERE id = 148;
UPDATE exercises SET variations_en = 'Dumbbell shrug at your sides; behind-the-back shrug on the Smith machine.' WHERE id = 149;
UPDATE exercises SET variations_en = 'Basic bodyweight crunch; crunch holding a ball with straight arms toward the ceiling.' WHERE id = 150;
