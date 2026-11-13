-- V42__articles_en.sql
-- Song ngữ bài hướng dẫn tập luyện: tiêu đề, tóm tắt và nội dung chi tiết.

ALTER TABLE articles
    ADD COLUMN title_en VARCHAR(200) NULL AFTER title,
    ADD COLUMN summary_en VARCHAR(500) NULL AFTER summary,
    ADD COLUMN body_en TEXT NULL AFTER body;

UPDATE articles SET
    title_en = 'A balanced plate: how much of each food group',
    summary_en = 'The five food groups and the proportions suggested by the UK''s Eatwell Guide, plus the groups to limit.',
    body_en = '## Key points
No meal has to be perfectly balanced. Aim for balance across the whole day, even across the week. This is UK guidance and applies to most adults.

## The five food groups
- Fruit and vegetables: more than one third of the food you eat each day; eat at least 5 portions from a variety. Fresh, frozen, canned or dried all count.
- Starchy carbohydrates (rice, potatoes, bread, noodles): also more than one third; favour higher-fibre or wholegrain options such as brown rice, and keep the skin on potatoes.
- Protein: beans, pulses, fish, eggs, meat. Choose lean meat, and eat less red meat and processed meat. Aim for at least 2 portions of fish a week (about 140 g per portion), one of which is oily fish such as salmon, sardines or mackerel.
- Dairy and dairy alternatives (such as soy milk): a source of protein and calcium; favour lower-fat, lower-sugar options.
- Oils and fats: choose unsaturated fats (vegetable oil, olive oil, sunflower oil) and use small amounts, because all fats are energy-dense.

## Groups to limit
Foods and drinks high in fat, salt and sugar such as biscuits, cakes, chocolate, sugary soft drinks and ice cream are not needed in the diet, so eat them less often and in small amounts. Fruit juice and smoothies together should be no more than 150 ml a day.

## Applying this to training
Energy needs vary from person to person, depending on activity level and many other factors. GymFlow does not calculate portions or prescribe diets. People with special dietary needs or health conditions should ask a dietitian. This guidance does not apply to children under 2.'
WHERE id = 1;

UPDATE articles SET
    title_en = 'Drinking enough fluid every day and when you train',
    summary_en = 'A reference intake of 6–8 cups of fluid a day, how to check it yourself, and when you need to drink more.',
    body_en = '## How much is enough
UK government guidance recommends about 6–8 cups or glasses of fluid a day. This is only a reference level; a simple self-check is pale, clear yellow urine.

## When you need to drink more
- Being pregnant or breastfeeding
- Being in a hot environment
- Exercising for a long time
- Being ill or recovering from illness

## Tips for people who train
- Drink steadily throughout the day.
- Top up when you sweat heavily during training; plain water is the best way to replace lost fluid.
- Plain water, lower-fat milk, low-sugar drinks, tea and coffee all count towards your fluid intake.
- Limit sugary drinks; juice and smoothies at most one small 150 ml glass a day, and preferably with a meal.
- Use caffeine in moderation; pregnant women should have no more than 200 mg of caffeine a day.'
WHERE id = 2;

UPDATE articles SET
    title_en = 'Six habits for better sleep',
    summary_en = 'Small changes to your pre-sleep routine, your bedroom and your activity can help you sleep better.',
    body_en = '## Six habits
- Keep a regular sleep schedule: go to bed and get up at a similar time every day, including days off.
- Wind down before bed: avoid phones, tablets and computers for about 1 hour before sleep; try reading, meditation, breathing exercises or quiet music.
- Deal with worries: talk to someone you trust, or write down tomorrow''s to-do list before bed.
- Keep the bedroom quiet, dark and cool: use earplugs, close the curtains fully, turn your phone face down, wear an eye mask if needed.
- Don''t force sleep: if you''re still awake after about 20 minutes, get up and sit somewhere comfortable doing something light; go back to bed when you feel sleepy.
- Exercise regularly: it helps you sleep better. If training close to bedtime makes it hard to fall asleep, train earlier in the day.

## Food, drink and sleep
A large meal close to bedtime can make it harder to fall asleep. Tea, coffee and some soft drinks contain caffeine. Alcohol and nicotine also affect sleep, so avoid them in the 1–2 hours before bed.

## When to ask for advice
This article is not intended for diagnosis. If poor sleep persists or affects your daily life, see a healthcare professional.'
WHERE id = 3;

UPDATE articles SET
    title_en = 'A 6-minute warm-up before training',
    summary_en = 'Five simple warm-up moves to help prevent injury and make your workout more effective.',
    body_en = '## Why warm up
Warming up properly helps prevent injury and makes your workout more effective. The routine below takes at least 6 minutes; you can make it longer if you need to.

## Five moves
- Marching on the spot: 3 minutes, then walk back and forth; swing your arms in rhythm with your steps, elbows bent, hands loosely closed.
- Front heel taps: about 60 taps in 60 seconds, alternating legs, toes pointing up, standing leg slightly bent.
- Knee lifts: about 30 lifts in 30 seconds, bringing each knee up to the opposite hand; brace your abs and keep your back straight.
- Shoulder rolls: while marching on the spot, roll your shoulders forward 5 times and back 5 times, arms relaxed; do 2 sets.
- Shallow squats: feet shoulder-width apart, arms extended in front, lower no more than 10 cm then stand up; repeat 10 times.

## Safety
Stop immediately if you feel pain or unwell. Ask a healthcare professional first if you have a health condition, an injury, recent surgery, are pregnant or have recently given birth.'
WHERE id = 4;

UPDATE articles SET
    title_en = 'A 5-minute stretch after your workout',
    summary_en = 'Five gentle stretches to help you relax, improve flexibility and bring your heart rate back down.',
    body_en = '## Purpose
Cool down gradually, improve flexibility and help your heart rate slow down. The whole routine takes about 5 minutes; take extra time if you need it.

## Five moves, holding each for 15–20 seconds
- Glute stretch: lie on your back, pull both knees toward your chest, cross your right leg over your left thigh, clasp both hands behind your left thigh and pull toward your chest; switch sides.
- Hamstring stretch: lie on your back, lift your right leg and hold under the knee; left leg bent, pull the right leg straight toward you; switch sides.
- Inner thigh stretch: sit with your back straight, press the soles of your feet together, hold your feet and slowly lower your knees toward the floor.
- Calf stretch: step your right foot forward, bend slightly and lean in; left leg straight, lower your left heel to the floor; you can hold on to a wall or chair.
- Quad stretch: lie on your right side, grasp the top of your left foot and pull the heel toward your glutes, knees together; switch sides.

## Note
People with an injury, a medical condition or who are pregnant may need to adjust the moves; ask a physiotherapist or healthcare professional.'
WHERE id = 5;

UPDATE articles SET
    title_en = 'How much activity is enough each week?',
    summary_en = 'Activity recommendations for adults aged 19–64 and how to recognise moderate and vigorous intensity.',
    body_en = '## Adults aged 19–64
- Do strength training for the major muscle groups (legs, hips, back, abdomen, chest, shoulders, arms) on at least 2 days a week.
- At least 150 minutes of moderate-intensity or 75 minutes of vigorous-intensity activity each week.
- Spread it evenly over 4–5 days a week, or every day.
- Reduce time spent sitting and lying down; break up long periods of sitting with activity.

## Recognising intensity
- Moderate: your heart beats faster, you breathe faster and you feel warmer; you can still talk but you can''t sing. Examples: brisk walking, cycling, dancing.
- Vigorous: you breathe hard and fast and can''t say more than a few words without pausing for breath. Examples: running, swimming, climbing stairs, skipping rope.

Strength exercises should be done to the point where you need a short rest before repeating, and they count separately — they do not replace the 150 minutes of cardio.

## Further reading
The World Health Organization (WHO) has a 2020 set of guidelines for each age group; see the original document in the sources section.

## Note
If you haven''t exercised for a long time, or you have a medical condition or concerns about your health, ask your doctor before you start.'
WHERE id = 6;

UPDATE articles SET
    title_en = 'Starchy carbs and fibre: how to choose well',
    summary_en = 'Why starchy carbs are a main energy source, which types to favour, and how to store leftover rice safely.',
    body_en = '## How much of your food should be starchy carbs
According to the UK''s Eatwell Guide, starchy foods such as potatoes, bread, rice, noodles and cereals should make up more than one third of the food you eat, and should feature every day.

## Why you need them
- They are a good source of energy and also provide fibre, calcium, iron and B vitamins.
- Gram for gram, starchy carbs provide less than half the energy of fat. What usually makes a starchy dish "fatty" is the oil or butter added during cooking and eating.

## Favour higher-fibre options
- Choose brown rice, wholemeal bread, wholewheat noodles and oats; eat potatoes with the skin on when you can.
- Fibre helps your gut work well and keeps you feeling full for longer, which is useful if you want to manage your weight.
- Boiling, steaming or baking potatoes with a little oil is better than frying.

## Leftover rice: store it properly
- If you''re not eating it straight away, cool it and put it in the fridge within 1 hour, and eat it within 24 hours.
- Reheat it thoroughly and evenly, and only reheat it once.
- Throw away rice or grains that have been left at room temperature overnight.

## Note
GymFlow does not calculate portions. People who suspect a wheat allergy or intolerance should ask a doctor rather than cutting out a whole food group on their own.'
WHERE id = 7;

UPDATE articles SET
    title_en = 'Fat: which types to limit, which to choose',
    summary_en = 'Saturated, trans and unsaturated fats explained, with the recommended limits in the UK.',
    body_en = '## Your body still needs some fat
Fat provides essential fatty acids that the body cannot make itself, and helps you absorb vitamins A, D and E. But all fats are energy-dense: 1 g of fat provides 9 kcal, while 1 g of carbohydrate or protein provides 4 kcal.

## Saturated fat: cut down
- Found in large amounts in fatty meat, sausages, butter, lard, hard cheese, cream, biscuits, cakes, palm oil, and coconut oil and coconut milk.
- Eating a lot can raise "bad" (LDL) cholesterol and increase the risk of heart disease and stroke.
- UK recommendation: men no more than 30 g and women no more than 20 g of saturated fat a day; children need less.

## Trans fat: keep it low
Occurs naturally at low levels in meat and dairy, and in partially hydrogenated vegetable oils. Adults should have no more than about 5 g a day.

## Unsaturated fat: swap some in
- Monounsaturated: olive oil, rapeseed oil, avocado, almonds, peanuts.
- Polyunsaturated: omega-6 in corn oil, sunflower oil and walnuts; omega-3 in oily fish such as herring, sardines, salmon and mackerel.
- Aim to eat at least 2 portions of fish a week, one of which is oily fish.

## Reading food labels (per 100 g)
- High fat: more than 17.5 g. Low fat: 3 g or less.
- High saturated fat: more than 5 g. Low saturated fat: 1.5 g or less.
- A "less fat" label only means at least 30% less than a similar product — it is not necessarily low in energy.'
WHERE id = 8;

UPDATE articles SET
    title_en = 'Protein sources: how to eat meat sensibly',
    summary_en = 'Protein can come from meat, fish, eggs and beans; limit red meat and processed meat, choose lean cuts and cook with less fat.',
    body_en = '## Many protein sources
A balanced diet can get protein from meat, fish, eggs or non-animal sources such as beans and legumes. Chicken, pork, lamb and beef are all rich in protein; red meat also provides iron, zinc and B vitamins, and meat is one of the main sources of vitamin B12.

## Limit red meat and processed meat
- Eating too much red meat and processed meat can increase the risk of colorectal cancer; processed meat is also often high in salt.
- If you are eating more than 90 g (cooked weight) of red or processed meat a day, you should cut down to 70 g. On days when you eat a lot, eat less on the following days so the average stays no more than 70 g a day.
- Processed meat includes sausages, bacon, ham, salami, canned meat and pâté.

## Choosing and cooking more healthily
- Choose lean cuts; the more white you see, the more fat there is.
- Remove chicken and turkey skin; trim visible fat before cooking.
- Grill instead of fry; do not add oil or fat when it is not needed.
- Reduce the meat in stews and curries, replacing part of it with vegetables, beans and starchy foods.

## Food safety
Do not wash raw meat, because splashing water spreads bacteria onto other surfaces. Poultry, pork, offal, minced meat and sausages must be cooked thoroughly all the way through.

## Note
GymFlow does not provide protein amounts personalised by body weight. People with special needs or who are pregnant should ask a nutrition professional; pregnant women need to avoid liver and liver products.'
WHERE id = 9;

UPDATE articles SET
    title_en = 'Preventing and managing common running injuries',
    summary_en = 'Five injuries common among runners, how to recognise them, initial management, when to see a doctor and how to prevent them.',
    body_en = '## General principles
Listen to your body: do not run while in pain, and only run again once you have recovered sufficiently. This article is not intended for diagnosis.

## Five common injuries
- Knee pain: pain in front of, around or behind the kneecap. Apply an ice pack wrapped in a damp towel for at most 20 minutes, several times a day. If the pain is severe or there is swelling, see a doctor immediately; if the pain is mild but does not go away after 1 week, see a doctor or a physiotherapist.
- Achilles tendon pain: pain and swelling at the back of the ankle or the heel, possibly worse in the morning. See a doctor if it does not go away after 2–3 weeks; sudden sharp pain may be a tendon rupture and needs immediate medical attention.
- Shin splints: a dull ache at the front of the lower leg. Apply an ice pack wrapped in a towel for the first few days, rest for a few weeks and then start running again gradually.
- Heel and sole pain: usually caused by a sudden increase in running distance, running downhill or worn-out shoes that do not support the foot. Roll a frozen water bottle under the sole of the foot for about 15–20 minutes.
- Hamstring or calf strain: sudden pain as if you have been kicked. Stop running immediately, apply ice for at most 20 minutes several times a day, and elevate the leg.

Always wrap ice in a towel; never place ice directly on the skin.

## Prevention
- Shoes: get advice on choosing shoes at a running store; suitable shoes for beginners do not have to be expensive.
- Warm up for 5–10 minutes with brisk walking or easy jogging; cool down for 5–10 minutes with slow jogging or walking.
- Progress gradually: run a similar session at least 3–4 times before increasing speed or distance.
- Add strength exercises around the knee such as Wall Squat and In-place Lunge in the exercise library.'
WHERE id = 10;

UPDATE articles SET
    title_en = 'How to use gym machines correctly for beginners',
    summary_en = 'A guide to adjusting machines, choosing the weight pin and the most basic safety notes when you first step into the gym.',
    body_en = '### 1. Why should beginners start with selectorized machines?
When you are just starting out, your nervous system and muscles are not used to balancing a barbell or free dumbbells. Selectorized machines have a fixed track, which helps you isolate the target muscle group precisely and minimise the risk of injury.

### 2. Three preparation steps on every machine
1. **Adjust the seat height and back pad**: The joint you need to move (such as the knee or shoulder joint) must line up with the red/yellow pivot axis of the machine.
2. **Check the weight selection pin**: The metal pin must be inserted fully into the weight stack slot, not left hanging halfway out.
3. **Test the range of motion**: Pull or push once with the lightest weight to make sure the range of motion does not cause any catching or joint pain.

### 3. Safe movement principles
- Move smoothly: 1 second for the effort phase (push/pull) and 2–3 seconds for the return phase.
- Never let the weight plates clang against each other at the end of a set.'
WHERE id = 11;

UPDATE articles SET
    title_en = 'How to choose the right weight when you start training at the gym',
    summary_en = 'Do not lift too heavy and do not choose weights that are too light. A guide to choosing the right weight scientifically, based on your perception of effort.',
    body_en = '### 1. Common mistakes about weight
Many beginners fall into two extremes: either choosing weights that are too heavy, which leads to form breakdown and injury, or choosing weights so light that after 15 reps they still feel no muscle fatigue at all. Both approaches slow down your training progress.

### 2. The 2 reps in reserve rule (RIR 2)
The ideal weight for a beginner is the weight at which, when you complete your target reps (for example 10 reps), you feel you could only manage exactly **1 to 2 more reps** with perfect technique if you were forced to.

### 3. Procedure for testing your weight on the first session
- Start with the lightest weight or an unloaded bar to learn the technique thoroughly.
- Increase gradually in small increments (1–2 kg per side).
- When you notice the pushing speed starting to slow on the last 2 reps but your form is still straight and correct, that is your current training weight.'
WHERE id = 12;

UPDATE articles SET
    title_en = 'How to choose sets and reps to match your goal',
    summary_en = 'Understand what sets and reps mean so you are not confused by a training programme and you reach the physique goal you want.',
    body_en = '### 1. What are sets and reps?
- **Rep (Repetition)**: One complete repetition of the movement (for example, one down-and-up of a Squat).
- **Set**: A set is a series of continuous reps before you get to rest.

### 2. Guidelines by goal
- **Improving endurance and muscle tone**: 2–3 sets of 12–15 reps with light to moderate weight.
- **Increasing muscle size (Hypertrophy)**: 3–4 sets of 8–12 reps with moderate weight.
- **Maximising strength (Strength)**: 3–5 sets of 4–6 reps with heavy weight (only applies once you have mastered the technique).

### 3. Recommendations for beginners in the first 4 weeks
In the first month, stick to the golden formula: **3 sets x 10–12 reps** for every main compound exercise to build a solid foundation.'
WHERE id = 13;

UPDATE articles SET
    title_en = 'How long should you rest between sets?',
    summary_en = 'Resting too briefly means the muscles have not refuelled, while resting too long lets them cool down. Standard rest times for each type of exercise.',
    body_en = '### 1. Why rest time matters
Rest between sets is the time for the body to regenerate ATP energy and clear out the metabolic by-products that cause muscle fatigue. If you scroll on your phone for too long and your muscles cool down, the risk of injury in the next set rises sharply.

### 2. Scientifically standard rest times
- **Heavy compound exercises (Squat, Deadlift, Bench Press)**: Rest **2 to 3 minutes**. The nervous system and cardiovascular system need enough time to recover to keep the next set safe.
- **Isolation exercises and machines (Bicep Curl, Lateral Raise, Leg Extension)**: Rest **60 to 90 seconds**.
- **Ab exercises and light-intensity cardio**: Rest **30 to 45 seconds**.

### 3. Signs you are ready for the next set
You are ready when your heart rate and breathing have returned to a relatively steady level, your muscles no longer feel intensely hot and sore, and your mind is fully focused.'
WHERE id = 14;

UPDATE articles SET
    title_en = 'Common mistakes beginners at the gym need to avoid',
    summary_en = 'A round-up of classic mistakes, from skipping the warm-up and lifting with momentum to breathing incorrectly, that beginners often make.',
    body_en = '### 1. Skipping the warm-up to heat up the body
Many people walk into the gym and launch straight into heavy lifting. A 5–8 minute warm-up with joint rotations and light muscle activation raises body temperature, lubricates the joints and reduces the risk of muscle strain by 80%.

### 2. Lifting with momentum (Ego Lifting)
Using weights that are too heavy and swinging your whole body to lift them is a leading cause of lower back injury and muscle tears. Always remember: muscles grow from time under tension, not from the load printed on the weight plate.

### 3. Holding your breath under exertion
Holding your breath for too long while pressing makes intracranial pressure and blood pressure spike, which can easily lead to dizziness or fainting. The golden rule: **inhale as you lower the weight (the lengthening phase) and exhale decisively as you push the weight up (the contracting phase)**.

### 4. Not drinking enough water during the session
Losing just 2% of the body''s water can reduce athletic performance by up to 15%. Take small sips of water after each set.'
WHERE id = 15;
