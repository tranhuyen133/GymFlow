-- V40__equipment_content_en.sql
-- Song ngữ nội dung chi tiết dụng cụ: cách sử dụng, điều chỉnh, lỗi thường gặp, lưu ý an toàn.

ALTER TABLE equipment
    ADD COLUMN usage_guide_en TEXT NULL AFTER usage_guide,
    ADD COLUMN adjust_guide_en TEXT NULL AFTER adjust_guide,
    ADD COLUMN common_mistakes_en TEXT NULL AFTER common_mistakes,
    ADD COLUMN safety_notes_en TEXT NULL AFTER safety_notes;

UPDATE equipment SET
    usage_guide_en = '1. Choose a ball of the right size (when seated, your thighs and lower legs should form roughly a 90-degree angle).
2. Keep good balance and control the movement smoothly.',
    adjust_guide_en = '1. Swiss ball: inflate it fully; when seated, your thighs should be parallel to the floor.
2. Medicine ball: choose a weight just heavy enough to perform explosive reps at high speed.',
    common_mistakes_en = 'Using the ball on surfaces with wood splinters or sharp objects; under-inflating the ball and losing balance; throwing the medicine ball so it bounces straight back into your face.',
    safety_notes_en = 'Keep the ball away from sharp objects or rough surfaces that can scratch or puncture it.'
WHERE `key` = 'ball';

UPDATE equipment SET
    usage_guide_en = '1. Anchor the band to a solid support point or step firmly on it.
2. Pull the band under control, using the elastic tension through both the contraction and the stretch.',
    adjust_guide_en = '1. Choose a band whose color or thickness matches the resistance level (Light/Medium/Heavy).
2. Make sure the band is anchored securely to a post/rack, or stand with your foot centered on the band.',
    common_mistakes_en = 'Stretching the band more than 2.5 times its original length so it snaps back at you; anchoring it on sharp corners that cut or tear it; letting the band go so it snaps back.',
    safety_notes_en = 'Check the band for cracks or tears before pulling. Do not stretch the band beyond 2.5 times its natural length.'
WHERE `key` = 'band';

UPDATE equipment SET
    usage_guide_en = '1. Set the bar in the rack at chest or collarbone height.
2. Grip the bar symmetrically by aligning your fingers with the standard knurling marks.
3. Always brace your abs and keep your back straight before unracking the bar.',
    adjust_guide_en = '1. Raise or lower the J-hooks to collarbone level when standing so the bar is easy to unrack.
2. Set the safety pins about 3–5 cm below the lowest point of your thighs.
3. Always load plates evenly on both sides and lock them with spring clips/collars.',
    common_mistakes_en = 'Not using collars, so the plates slide out of place; setting the J-hooks too high and having to rise onto your toes to unrack; not setting the safety pins when lifting heavy without a spotter.',
    safety_notes_en = 'Always use collars on both ends of the bar. When lifting heavy, safety bars or a spotter behind you are mandatory.'
WHERE `key` = 'barbell';

UPDATE equipment SET
    usage_guide_en = '1. Pull the safety pin and set the backrest incline to the desired locking notch.
2. Lie or sit stably, placing both feet flat on the floor for a solid base.',
    adjust_guide_en = '1. Pull the safety pin and set the backrest to the desired notch (flat 0°, incline 30°/45°, upright 75°/90°, decline -15°).
2. Set the seat pad slightly upward to keep your hips from sliding during incline presses.',
    common_mistakes_en = 'The locking pin not seated deep in the notch, so the backrest collapses under load; placing the bench on an uneven floor so it wobbles; setting the incline too steep (>60°) and turning a chest press into a shoulder press.',
    safety_notes_en = 'Check that the incline locking pin is fully engaged before loading heavy weight on the bench. Place the bench on a non-slip floor.'
WHERE `key` = 'bench';

UPDATE equipment SET
    usage_guide_en = '1. Set up a mat on a flat, non-slip floor.
2. Focus on bracing your abs and keeping your body in a straight line from head to heels.',
    adjust_guide_en = '1. Use a mat with good grip that won''t slip.
2. Choose a variation that matches your strength (elevate your hands if you can''t yet do floor push-ups).',
    common_mistakes_en = 'Letting your lower back sag during planks or push-ups; holding your breath while straining; not warming up your joints properly before training.',
    safety_notes_en = 'Warm up your wrists, knees, and shoulders thoroughly before training. Prioritize correct technique before increasing reps.'
WHERE `key` = 'bodyweight';

UPDATE equipment SET
    usage_guide_en = '1. Adjust the pulley up or down to the target height and check that the locking pin is secured.
2. Attach the appropriate handle (straight bar, rope, single handle) to the safety carabiner.
3. Stand solidly and brace your core to stay balanced against the cable''s constant pull.',
    adjust_guide_en = '1. Pull the adjustment pin, slide the pulley to the desired height (high - chest level - low near the floor), then release the pin so it seats firmly in the hole.
2. Attach the appropriate handle (straight bar, triceps rope, D-handle) to the safety carabiner.
3. Check that the weight-selection pin is fully inserted.',
    common_mistakes_en = 'The carabiner not locked, so the handle slips off mid-pull; letting the cable jerk your body suddenly; standing too close or too far so the cable rubs against the pulley groove.',
    safety_notes_en = 'Check that the weight-selection pin is fully inserted. Do not let go of the handle so the stack slams back down.'
WHERE `key` = 'cable';

UPDATE equipment SET
    usage_guide_en = '1. Adjust the seat or pedals so you''re comfortable and your knees don''t lock at full extension.
2. Start at an easy pace for 3–5 minutes to let your body adjust before increasing intensity.',
    adjust_guide_en = '1. Treadmill: clip the emergency stop cord to your shirt; adjust incline and speed gradually.
2. Exercise bike: set the seat level with your hip bone when standing beside the bike; at the bottom of the pedal stroke your knee should still be slightly bent 5–10 degrees.
3. Rowing machine: set the foot straps across the widest part of your foot, and choose a damper setting of 4–6.',
    common_mistakes_en = 'Looking down at your feet or using your phone while on the treadmill; stepping off the treadmill before it has fully stopped; rounding your back while rowing; setting the bike seat too low and causing knee pain.',
    safety_notes_en = 'Always clip the emergency stop cord to your clothing on the treadmill. Slow down gradually before stepping off the treadmill.'
WHERE `key` = 'cardio-machine';

UPDATE equipment SET
    usage_guide_en = '1. Place both hands on the bars, lift your whole body up, with your elbows nearly straight.
2. Lean your torso slightly forward (to target the chest) or keep it upright (to target the triceps).
3. Lower yourself under control until your arms reach a 90-degree angle, then push up decisively.',
    adjust_guide_en = '1. If the dip bars are width-adjustable: narrow them (shoulder width) to target the triceps, widen them to target the lower chest.
2. Adjust the step platform for safe mounting and dismounting.',
    common_mistakes_en = 'Lowering too deep so the shoulders roll too far forward, causing shoulder bursitis; kicking your legs and jerking your torso; locking out the elbows too hard at the top.',
    safety_notes_en = 'Do not lower too deep, which overstretches the shoulder capsule. People with a history of shoulder injury should use assistive padding.'
WHERE `key` = 'dip-bars';

UPDATE equipment SET
    usage_guide_en = '1. Choose an appropriate weight and grip the handle firmly at its center.
2. Keep your wrists straight; don''t let them bend backward when pressing.
3. On a bench, rest the dumbbells on your thighs first, then use your thighs to help bring them to chest level as you lie back.',
    adjust_guide_en = '1. For adjustable dumbbells: turn the dial or pin to the desired weight marking and listen for the click before lifting.
2. Choose a weight that lets you fully control 8–12 reps with proper form.',
    common_mistakes_en = 'Letting your wrists bend backward and take the load instead of keeping them straight; swinging the weights using upper-body momentum; dropping the weights to the floor from height, endangering people nearby.',
    safety_notes_en = 'Do not drop the dumbbells to the floor from height, to avoid joint injury and damage to the gym floor. At the end of a set on the bench, lower the weights to your thighs and sit up slowly.'
WHERE `key` = 'dumbbell';

UPDATE equipment SET
    usage_guide_en = '1. Place your hands on the curved sections that match the natural angle of your wrists.
2. Keep your elbows fixed close to your sides during curls; don''t swing your torso.',
    adjust_guide_en = '1. Choose the curved position on the bar that matches your wrists'' natural angle with either an underhand or overhand grip.
2. Secure the collars on both sides just like a straight bar.',
    common_mistakes_en = 'Swinging your elbows forward and back during curls; letting your elbows drift too far from your sides and losing biceps tension; using too much weight and arching backward.',
    safety_notes_en = 'Always use collars on both ends. Avoid lifting your elbows too high at the top of the movement, which removes tension from the biceps.'
WHERE `key` = 'ez-bar';

UPDATE equipment SET
    usage_guide_en = '1. Place the muscle group you want to release on the foam roller.
2. Use your body weight to apply light pressure and roll slowly along the muscle fibers at a slow pace, 30–60 seconds per muscle group.',
    adjust_guide_en = '1. Place the roller on a flat mat.
2. Use your hands and the other leg to reduce the pressure on the roller if the muscle is too tight and painful.',
    common_mistakes_en = 'Rolling directly over bare lumbar vertebrae or the knee joint; rolling too fast and skipping over tight spots; holding your breath and tensing up when you hit a painful spot.',
    safety_notes_en = 'Do not roll directly over bone joints or the lumbar spine where there is no muscle padding. Stop if you feel sharp, stinging pain.'
WHERE `key` = 'foam-roller';

UPDATE equipment SET
    usage_guide_en = '1. Grip the handle firmly, feet a little wider than shoulder width.
2. Drive mainly from the hips and glutes (hip hinge) when swinging; don''t use your lower back to pull the weight up.
3. Keep your spine straight and your abs braced throughout the movement.',
    adjust_guide_en = '1. Choose a weight that suits the goal (heavier for hip swings than for overhead presses).
2. The handle must be smooth, with no sharp edges that tear your calluses.',
    common_mistakes_en = 'Rounding and bending your lower back to pull the weight instead of driving from the hips (hip hinge); letting the bell bang hard into your forearm when bringing it to the rack position; bending your knees too deep and turning the swing into a squat.',
    safety_notes_en = 'Check that the handle isn''t slippery with sweat. Make sure the space around you is completely clear before swinging.'
WHERE `key` = 'kettlebell';

UPDATE equipment SET
    usage_guide_en = '1. Adjust the seat height and pads so the working joint lines up with the machine''s pivot axis.
2. Insert the weight pin fully into the stack before starting.
3. Move smoothly, controlling speed on both the push and the return.',
    adjust_guide_en = '1. Set the seat height so the machine''s pivot (the round joint marked in color) lines up with your working joint (knee/shoulder/elbow).
2. Adjust the back/chest pad so your body is held firmly in place.
3. Insert the weight pin fully into the stack before pressing.',
    common_mistakes_en = 'Leaving the weight pin loosely inserted so it pops out mid-set; not adjusting the seat, so the movement path loads the wrong joint; letting the stack drop and slam at the end of the range.',
    safety_notes_en = 'Don''t let the weight plates slam into each other at the end of a rep. Wipe the sweat off the machine pads after training.'
WHERE `key` = 'machine';

UPDATE equipment SET
    usage_guide_en = '1. Read the instructions carefully for each specialized tool.
2. Perform at a moderate pace to master technique before increasing speed or load.',
    adjust_guide_en = '1. Check for a safe clearance of at least 2 meters around you when using ropes, rollers, or sleds.
2. Choose accessories that suit your body type and training level.',
    common_mistakes_en = 'Letting your lower back sag during ab-wheel rollouts; using a violent jerk of the torso when swinging battle ropes.',
    safety_notes_en = 'Ensure a safe clearance around you when swinging ropes or pushing a sled on the training floor.'
WHERE `key` = 'other';

UPDATE equipment SET
    usage_guide_en = '1. Grip the edge of the plate firmly with your palm, or hook your fingers through the handle holes if present.
2. Use your legs and hips to lift heavy plates off the floor; don''t bend your back.',
    adjust_guide_en = '1. Choose a plate with a diameter and grip that suit the exercise.
2. When racking plates, arrange them from largest to smallest for easy access.',
    common_mistakes_en = 'Rounding your back when lifting heavy plates off the floor; leaving your fingers between plates when loading them onto the peg, crushing them; using a plate the wrong size for the bar sleeve.',
    safety_notes_en = 'Be careful not to pinch your fingers when loading or unloading plates from the rack and bar. Always return plates to the correct weight position after use.'
WHERE `key` = 'plate';

UPDATE equipment SET
    usage_guide_en = '1. Grip the bar wider than shoulder width (overhand) or at shoulder width (underhand), with a firm palm grip.
2. Hang stably and actively pull your shoulder blades down before pulling your body up until your chin clears the bar.
3. Lower yourself under control back to the starting hang.',
    adjust_guide_en = '1. If the bar has multiple grip positions (wide, narrow, parallel), choose the grip that matches your target muscle group.
2. If you need assistance: attach a resistance band to the bar or use a step platform to get up.',
    common_mistakes_en = 'Using uncontrolled kipping before you have basic strength; not pulling your shoulder blades down before pulling, causing shoulder pain; letting go and dropping freely on the way down.',
    safety_notes_en = 'Check that the bar is secure before hanging your full body weight on it. Beginners should use resistance band assistance or an assisted pull-up machine.'
WHERE `key` = 'pullup-bar';

UPDATE equipment SET
    usage_guide_en = '1. Rotate your wrists slightly to release the hooks before starting the movement.
2. Place your feet slightly forward of the bar to match its fixed vertical path.
3. At the end of the set or when fatigued, rotate your wrists to hook the bar into the nearest catch.',
    adjust_guide_en = '1. Set the safety stops on both guide rails 2–3 cm below the lowest point of the movement.
2. Set the bar at a height where you can comfortably rotate your wrists to release the hooks.
3. Position your feet slightly forward to compensate for the fixed vertical path.',
    common_mistakes_en = 'Forgetting to rotate the wrist hooks in an emergency; not setting the safety stops; placing your feet too far back, which puts heavy stress on the knee joints when squatting.',
    safety_notes_en = 'Always set the secondary safety stops below the deepest point of the movement before starting a heavy set.'
WHERE `key` = 'smith-machine';
