import { query } from '../lib/db/mysql';
import { randomUUID } from 'crypto';

export const HIS_OMEGA_LEADERSHIP_AND_TEAM = `Heartfulness International School, Omega Branch (HIS Omega) — Management Team, Unit Heads & Academic Team

=== MANAGEMENT TEAM (https://www.hisomega.org/management-team/) ===
1. Chairman: Shri. Rajesh Rathod
   - Education & Career: B.Tech from IIT Bombay and M.E. from IISc Bangalore; worked extensively in the Indian IT industry for over 30 years in senior management roles and currently serves as a CTO. Enjoys exploring Mathematics, Physics, and Philosophy.
   - Association: Member of Shri Ram Chandra Mission since school days; part of the core team that set up Omega School's academic infrastructure during its formative years.
2. Correspondent: Shri. Bharath Madhavan
   - Education & Career: B.Tech in Mechanical Engineering from IIT Madras; two Master's degrees in the USA (Robotics at University of Maryland, College Park; Telecommunication at Johns Hopkins University). Lived in the USA for 16 years before returning to India in 2010; 25 years of professional experience including Solutions Architect at Cisco Inc. (Video and Cloud technologies) and leadership roles in large enterprises and start-ups.
   - Heartfulness Role: Practises Heartfulness Meditation (Sahaj Marg) and serves as Director of Heartfulness Education Programs, organizing events and managing programs across schools nationwide.
3. Chief Financial Officer (CFO): Shri. Subramanian V
   - Credentials & Career: Chartered Accountant, Cost Accountant, and ACCA (UK) with 30+ years of experience across auditing, financial strategy, and management consulting. Led a Greenfield manufacturing project with Rs. 400 crores capital investment to Rs. 800 crores annual turnover.
   - Spiritual & Academic Service: 25+ years Heartfulness Meditation practitioner and 9+ years certified trainer; serves on the Board of Studies at Shasun Jain College for Women and SDNB Vaishnav College.
4. Director – Strategy, Research and Innovation: Dr. S. Bhavanishankar
   - Vision: Guides Lalaji Memorial Omega International School (HIS Omega) in realizing Founder Pujyashri Parthasarathi Rajagopalachariji's vision of nurturing balanced youngsters whose thoughtful minds are guided by noble souls and physical actions, empowering students through literacy, numeracy, science, life skills, and social & values education.

=== UNIT HEADS (https://www.hisomega.org/unit-heads/) ===
- Principal – CBSE (Senior School): P. Muthiah (B.A., M.A., M.Phil. (His), B.Ed., Ph.D.)
- Principal – CBSE (Junior School): Priya Susan Satish (B.Sc. (Zoo), B.Ed. (Eng & Bio), M.A. (Eng))
- Head of School – Cambridge and IB: Divya Samvit Rajagopalan (B.A. (Cor. Sec.), M.A., B.Ed. (English), PGDSLM, M.Ed. (IB), M.A. Education)
- Principal – NIOS: Radha Devi Sanku (B.E. (EEE), M.E. (CS), P.G.C.E.)
- Headmistress – Montessori: Preetha George (B.Sc. (Home Science), NTTC, CIDTT)
- Headmistress – Early Years Program: Sreelekha R (B.B.M., DPPTT, Mont. Training, Dip. Storytelling, Dip. ECE, Cert. ECE)
- Unit Head – Special Education (Indigo): Priti Venkatesan (B.Com. (Hons), LLB, ACS, PGDBM, Dip. Early childhood education, Licensed Davis Facilitator (USA), DLS Mentor, NLP Practitioner, Certified Career Mentor)

=== ACADEMIC TEAM, VICE PRINCIPALS, COORDINATORS & DEPARTMENT HODs (https://www.hisomega.org/academic_team/) ===
Vice Principals, Assistant Heads & Coordinators:
- Vice Principal – CIS Senior School & IBDP Coordinator: P.A. Srinivasan (Commerce Dept.)
- Vice Principal – CIS Junior School: Dr. N. Mallika Mahesh (Biology Dept.)
- Vice Principal – CBSE Middle School: V. Maheswari (Mathematics Dept.)
- Coordinator – CBSE Primary School: C. Uma (Primary Dept.)
- Assistant Headmistress – Montessori: Jatinder Kaur
- Assistant Unit Head – Special Education (Indigo): Kavitha Rajagopalan

Department Heads (HODs):
- Arts & Craft HOD: R. Lakshmi Prabha
- Performing Arts HoD: Vinita Venkataraman
- Commerce HOD: V. Sathya Narayana Rao
- Computer Science HOD: S. Vetrikumaran | HOD CBSE Junior: R. Sudha
- English HOD: G. Raajheshwaree | HOD CBSE Junior: Rohini Karthikeyan
- Foreign Languages: French (Remya Swaminathan, Divya Badhrinarayanan, Indrani Myriam, Unnamalai, Durga Lakshmi Paladugu), German (V. Ravi Kumar, T. Aarathy), Spanish (Keshav Kannan, Jeorge Bush M)
- Humanities HOD: Padma Ganesan | HOD CBSE Junior: V. Chitra
- Tamil HoD: Balaji J | HOD CBSE Junior: S. Bavani
- Hindi HOD: Dr. P Kavita Bohra | HoD Hindi CBSE Junior School: Meenakshi Saini
- Sanskrit: R. Sundar, Omprakash
- Library & Information Sciences HoD: Sita Sethuraman
- Life Skills Activity (LSA) HOD: D. Harathi
- Mathematics HOD: Biji Sukumar | HOD CBSE Junior: P.A. Vijayalakshmi
- Science – Physics HOD: Dr. Amrita Saxena
- Science – Chemistry HOD: G. Shantha
- Science – Life Science HOD: Albert Gnana Prasad
- Science – CBSE Junior School HoD: K. Mythili
- Atal Tinkering Lab (ATL): M. Venkata Subramanian
- Student Counsellors: Murzhitha Zheren, Sirisha Yaramati, S Asma Banu
- Physical Education HOD: M. Jayachandiran
- Uniform Corps HOD: Vijaya Nath Yadav
- Value Based Spiritual Education (VBSE) HOD: Ushma S.`;

export const HIS_OMEGA_AGENTS = [
  {
    grade: 'General / All Grades',
    name: 'HIS General School Counselor',
    tone: 'Friendly & Welcoming',
    knowledge: `Heartfulness International School, Omega Branch (HIS Omega — Lalaji Memorial Omega International School)
Official Website: https://www.hisomega.org/
Campus Address: 79, Omega School Road (Pallavaram Road), Kolapakkam, Kovur Post, Chennai, Tamil Nadu – 600128, India.
Early Years & Indigo Campus: BMA Campus (Babuji Memorial Ashram), Manapakkam Main Road, Manapakkam, Chennai.
Contact Numbers: 044-66241130, 044-66241117, 044-66241105, +91 92824 47706
Transportation Office: 044-66241109 | transport@omegaschools.org
Admissions Email: admissions@hisomega.org | General Email: info@hisomega.org

Admissions 2027–2028 & Fee Payment:
Admissions Open for 2027–2028 via https://www.hisomega.org/admissions/ (₹1,000 online application fee). Easy EMI Options Available Through GrayQuest for Montessori, Early Years Programme, Cambridge & IBDP Programmes Only.

${HIS_OMEGA_LEADERSHIP_AND_TEAM}

Academic Streams Offered:
1. Montessori Programme (M0/PreKG, M1/LKG, M2/UKG; ages 2.5–6) at Kolapakkam Main Campus — https://www.hisomega.org/montessori-introduction/
2. Early Years Programme (EYP / Heartful Kids: Nursery, K1, K2) at Manapakkam Campus — https://www.hisomega.org/eyp-Introduction/
3. Central Board of Secondary Education (CBSE, Affiliation No. 1930200 — Junior Grades I–VIII & Senior Grades IX–XII) — https://www.hisomega.org/cbse-about-the-curriculum/
4. Cambridge International Stream (CIS — Foundation Stage to Year 12: Primary Checkpoint, Secondary Checkpoint, IGCSE, AS & A Levels) — https://www.hisomega.org/cis-about-the-curriculum/
5. International Baccalaureate Diploma Programme (IBDP — Ages 16–19, Grades XI & XII) — https://www.hisomega.org/ibdp-about-the-curriculum/
6. National Institute of Open Schooling (NIOS — Open Basic Education Grade 8, Secondary Grades 9–10, Senior Secondary Grades 11–12) — https://www.hisomega.org/nios-about-the-curriculum/
7. Special Education / Indigo (Indigo Heartful Kids hybrid CBSE–NEP + CIE + Davis Learning Strategies curriculum) — https://www.hisomega.org/Indigo-about-the-curriculum/

School Timings & Dress Code:
- Early Years Programme (Nursery, K1, K2): 8:45 AM – 1:10 PM (Monday to Friday)
- Montessori: M0 & M1: 8:45 AM – 1:10 PM; M2: 8:45 AM – 1:45 PM (Monday to Friday)
- CBSE & Cambridge Grades I & II: 8:45 AM – 3:10 PM (Monday to Friday)
- CBSE, Cambridge (Grades III+), IBDP, NIOS & Indigo: 7:45 AM – 3:10 PM (Monday to Friday; working Saturdays 7:45 AM – 12:30 PM)
- Dress Code: Uniforms as prescribed.

Campus, Infrastructure & Transport:
Established in 2005 on a 22-acre green campus at Kolapakkam, HIS Omega combines value-based education, Heartfulness meditation, yoga, VBSE, smart classrooms, STEM & ATL labs, library, sports complexes, healthroom, canteen, bank ATM, and stores. Dedicated fleet of 55+ 40-seater buses with CCTV, GPS tracking, speed governors, and trained conductors serving over 2,000 students within a 15 km radius.`
  },
  {
    grade: 'Montessori',
    name: 'Montessori Guide & Counselor',
    tone: 'Friendly & Welcoming',
    knowledge: `Montessori Programme at Heartfulness International School, Omega Branch (HIS Omega)
Official Webpage: https://www.hisomega.org/montessori-introduction/
Campus: Omega Main Campus, 79, Omega School Road (Pallavaram Road), Kolapakkam, Kovur Post, Chennai – 600128
Headmistress – Montessori: Preetha George (B.Sc. Home Science, NTTC, CIDTT)
Assistant Headmistress – Montessori: Jatinder Kaur (B.A., B.Ed., Dip. A.M.I.)
Age Levels & Nomenclature: Ages 2½ to 6 years — M0 corresponds to PreKG, M1 corresponds to LKG, and M2 corresponds to UKG.
Working Hours (Monday through Friday):
- M0 & M1: 8:45 AM – 1:10 PM
- M2: 8:45 AM – 1:45 PM
Dress Code: Uniforms as prescribed.
Academic Contact: Phone 044-66241103 | Email: mont.info@hisomega.org
General Queries: Phone 044-66241105 / 044-66241130 / +91 92824 47706 | Email: info@hisomega.org | Admissions Portal: https://www.hisomega.org/admissions/

Curriculum & Methodology:
Early Childhood Education at HIS Omega offers both the Montessori system (at Kolapakkam main campus) and the traditional Kindergarten/EYP system (at Manapakkam campus, Babuji Memorial Ashram). The Montessori unit provides an authentic Montessori learning environment for children aged 2.5 to 6 years, supported by trained Montessori facilitators (AMI / Montessori diploma holders), focusing on independence, purposeful learning, motor skills, sensory perception, language arts, mathematics, and holistic development within a prepared Montessori environment.

Transition Pathway from Class 1 Onwards:
During the admission process, parents choose between the Montessori and Kindergarten units and indicate their preferred stream—CBSE or Cambridge—from Class 1 onwards. Upon completing M2, students seamlessly transition into Grade 1 CBSE or Cambridge at the Kolapakkam campus.

Admissions & EMI Options:
Admissions Open for 2027–2028 via https://www.hisomega.org/admissions/. Easy EMI options are available through GrayQuest for the Montessori Programme.`
  },
  {
    grade: 'Early Years Programme',
    name: 'Early Years Specialist',
    tone: 'Friendly & Welcoming',
    knowledge: `Early Years Programme (EYP — Heartful Kids) at Heartfulness International School, Omega Branch (HIS Omega)
Official Webpage: https://www.hisomega.org/eyp-Introduction/
Campus: Dedicated Manapakkam Campus (Babuji Memorial Ashram, Manapakkam Main Road, Chennai)
Headmistress – Early Years Program: Sreelekha R (B.B.M., DPPTT, Mont. Training, Dip. Storytelling, Dip. ECE, Cert. ECE)
Grades Covered: Nursery, K1 (Kindergarten 1), and K2 (Kindergarten 2)
Working Hours: 8:45 AM – 1:10 PM (Monday through Friday)
Dress Code: Uniforms as prescribed
Academic Info Contact: Phone 044-66241131 | Email: heartful.kids@hisomega.org
All Other Queries: Phone 044-66241105 | Email: info@hisomega.org | Admissions: https://www.hisomega.org/admissions/

1. Introduction — Welcome to Heartful Kids (https://www.hisomega.org/eyp-Introduction/)
What Makes Heartful Kids Special?
Our Manapakkam campus is a peaceful, green space where young children have the time and freedom to play, explore, wonder and simply be. Open lawns invite movement, a sandpit encourages digging and building, a cosy library welcomes stories, and a treehouse sparks imagination. Everyday natural elements such as a puddle after the rain, an anthill by the fence, or a mango tree heavy with fruit become part of everyday learning.

Why Heartful Kids?
- BELONG: Warm relationships help every child feel safe, seen and sure that they belong.
- EXPLORE: Children learn through their senses, movement and hands-on discovery.
- CREATE: Stories, art, music and imaginative play give children many ways to express their ideas.
- GROW: With time, encouragement and the right support, children build confidence, independence and a genuine love of learning.
Rooted in the values of Heartfulness, kindness, patience and gratitude are woven naturally into everyday experiences. Across Nursery, K1 and K2, children grow in confidence, communication, curiosity and independence, leaving with a growing sense of: "I can try. My ideas matter. I belong here."

2. Headmistress Message
Welcoming families to Heartful Kids, inspired by Aristotle's quote on educating the heart alongside the mind:
- The child is the centre of everything we do.
- They drive. We navigate: children bring questions and ideas; teachers observe, listen and guide.
- Play is at the heart of learning: developing communication, creativity, problem-solving, thinking and social-emotional skills.
- A child does not grow alone: parents and teachers partner closely.

3. Guidelines for Parents (Growing Together)
Encourages families to Nourish (wholesome foods, mealtime participation, calm screen-free meals), Rest (consistent sleep and peaceful bedtime stories), Make Space for Real-World Experiences (age-appropriate screen limits, outdoor play, reading, drawing), Connect (dedicated time, listening without comparing), Play/Explore/Discover (self-directed play with blocks, clay, natural objects), and Partner with Us.

4. EYP Curriculum (Learning with Heart)
Draws on NCF-FS (National Curriculum Framework for the Foundational Stage), Cambridge Early Years, Inquiry-based learning, and Project-based learning.
Programme Levels:
- Nursery (2½–4 years): Explore, Experience, Belong
- K1 (4–5 years): Connect, Investigate, Express
- K2 (5–6 years): Question, Think, Apply
Includes Blended Literacy Approach (whole-language + phonics), Montessori-Inspired EPL Activities, Hands-On Experiential Learning, and XSEED Curriculum aligned with NEP.

5. Learning in Action & Everyday Activities
Circle time, exploring materials, outdoor play, collaborative projects, and cultural/nature celebrations (Diwali, Aksharabhyasam, Nature Walk, Onam, Teacher's Day, Ganesh Chaturthi, Krishna Janmashtami, Bunny Programme, Guru Purnima).

6. Beyond EYP & Children's Corner
Transition from K2 at Manapakkam to Grade 1 (CBSE or Cambridge) at Kolapakkam develops Literacy, Mathematical Thinking, Independence, and Relationships.
Children's Corner: Optional relaxed after-care facility for EYP families available until 5:30 PM (rest and nap, create and explore, outdoor play, spending time with friends).

Admissions & EMI Options:
Admissions Open for 2027–2028 via https://www.hisomega.org/admissions/. Easy EMI options are available through GrayQuest for Early Years Programme.`
  },
  {
    grade: 'CBSE (K–12)',
    name: 'CBSE Academic Counselor',
    tone: 'Academic & Informative',
    knowledge: `CBSE Stream at Heartfulness International School, Omega Branch (HIS Omega)
Official Webpage: https://www.hisomega.org/cbse-about-the-curriculum/
Campus: 79, Omega School Road (Pallavaram Road), Kolapakkam, Kovur Post, Chennai – 600128
Affiliation: Central Board of Secondary Education (CBSE), Affiliation No. 1930200
Board Examinations: Conducts AISSE (All India Secondary School Examination) for Class X and AISSCE (All India Senior School Certificate Examination) for Class XII.

Leadership & Academic Contacts:
- Principal – CBSE (Senior School): P. Muthiah (B.A., M.A., M.Phil. (His), B.Ed., Ph.D.)
- Principal – CBSE (Junior School): Priya Susan Satish (B.Sc. (Zoo), B.Ed. (Eng & Bio), M.A. (Eng))
- Vice Principal – CBSE Middle School: V. Maheswari
- Coordinator – CBSE Primary School: C. Uma
- Senior School Academic Info: Phone 044-66241158 | Email: snehapriya@hisomega.org
- Junior School Academic Info: Phone 044-66241144 | Email: primaryschool@hisomega.org (Classes 1 to 4) | middleschool@hisomega.org (Classes 5 to 8)
- General Queries: Phone 044-66241130 / 044-66241105 | Email: info@hisomega.org | Admissions: https://www.hisomega.org/admissions/

Working Hours & Dress Code:
- Grades I & II: 8:45 AM – 3:10 PM (Monday to Friday)
- Grades III and above: 7:45 AM – 3:10 PM (Monday to Friday; if working Saturdays: 7:45 AM – 12:30 PM)
- Dress Code: Uniforms as prescribed.

Curriculum Focus & Architecture:
The primary focus of CBSE is evolving common standards of education in India by making learning meaningful, relevant, life-oriented, student-friendly, and student-centered.
- Junior & Middle School (Grades I–VIII): English, Mathematics, Science, Social Studies, Tamil/Hindi/Sanskrit, Computer Science, Arts, Physical Education, Life Skills Activity (LSA), Value Based Spiritual Education (VBSE), and Atal Tinkering Lab (ATL).
- Secondary (Grades IX–X): Board preparation for AISSE (Class X) with laboratory practicals and mentoring.
- Senior Secondary (Grades XI–XII): Preparation for AISSCE (Class XII) across Science (Physics, Chemistry, Mathematics, Biology, Computer Science), Commerce (Accountancy, Business Studies, Economics, Mathematics), and Humanities streams.

Admissions 2027–2028:
Applications are submitted online via https://www.hisomega.org/admissions/ with Birth Certificate, Transfer Certificate (TC), previous report cards, Aadhaar, and photographs.`
  },
  {
    grade: 'Cambridge International Stream (Grades I–XII)',
    name: 'Cambridge Stream Counselor',
    tone: 'Academic & Informative',
    knowledge: `Cambridge International Stream (CIS) at Heartfulness International School, Omega Branch (Lalaji Memorial Omega International School)
Official Webpage: https://www.hisomega.org/cis-about-the-curriculum/
Campus: 79, Omega School Road (Pallavaram Road), Kolapakkam, Kovur Post, Chennai – 600128
Affiliation: Cambridge Assessment International Education (CAIE) — Foundation Stage to Year 12

Leadership & Academic Contacts:
- Head of School – Cambridge and IB: Divya Samvit Rajagopalan (B.A. Cor. Sec., M.A., B.Ed. English, PGDSLM, M.Ed. IB, M.A. Education)
- Vice Principal – CIS Senior School & IBDP Coordinator: P.A. Srinivasan
- Vice Principal – CIS Junior School: Dr. N. Mallika Mahesh
- Academic Info Contact: Phone 044-66241127 | Email: cis.ib@hisomega.org
- General Queries: Phone 044-66241105 / 044-66241130 | Email: info@hisomega.org | Admissions: https://www.hisomega.org/admissions/

Working Hours & Dress Code:
- Grades I & II: 8:45 AM – 3:10 PM (Monday to Friday)
- Grades III and above: 7:45 AM – 3:10 PM (Monday to Friday; if working Saturdays: 7:45 AM – 12:30 PM)
- Dress Code: Uniforms as prescribed.

Curriculum Overview & Stages:
Lalaji Memorial Omega International School (Cambridge International School) is a Foundation Stage to Year 12 school offering Primary Checkpoint, Secondary Checkpoint, IGCSE, and AS & A Levels. With over 500 students from diverse parts of the world, the stream combines traditional and modern methodologies to nurture ethical, independent thinkers who achieve results on par with or better than international counterparts.
Guided by Founder Shri Parthasarathi Rajagopalachari's mandate ("Omega strives to produce youngsters who are balanced in soul, mind and body working in unison with soul, guiding the mind in its activities, and the body acting under the guidance of the mind"), students engage in classroom inquiry, field trips, conferences, Model United Nations (MUN), creative arts, debate, and sports, within a strong three-way partnership among students, parents, and teachers.

Admissions & EMI Options:
Admissions Open for 2027–2028 via https://www.hisomega.org/admissions/. Easy EMI options are available through GrayQuest for Cambridge Programme.`
  },
  {
    grade: 'IB Diploma Programme',
    name: 'IBDP Academic Coordinator',
    tone: 'Academic & Informative',
    knowledge: `International Baccalaureate Diploma Programme (IBDP) at Heartfulness International School, Omega Branch (Omega International School)
Official Webpage: https://www.hisomega.org/ibdp-about-the-curriculum/
Campus: 79, Omega School Road (Pallavaram Road), Kolapakkam, Kovur Post, Chennai – 600128
History & Authorization: First offered at Omega International School in 2015 for students aged 16 to 19 in the final two years of Secondary School (Grades XI & XII).

Leadership & Academic Contacts:
- Head of School – Cambridge and IB: Divya Samvit Rajagopalan (B.A. Cor. Sec., M.A., B.Ed. English, PGDSLM, M.Ed. IB, M.A. Education)
- Vice Principal – CIS Senior School & IBDP Coordinator: P.A. Srinivasan
- Academic Info Contact: Phone 044-66241127 | Email: cis.ib@hisomega.org
- General Queries: Phone 044-66241105 / 044-66241130 | Email: info@hisomega.org | Admissions: https://www.hisomega.org/admissions/

Working Hours & Dress Code:
- Working Hours: 7:45 AM – 3:10 PM (Monday to Friday; if working Saturdays: 7:45 AM – 12:30 PM)
- Dress Code: Uniforms as prescribed.

Curriculum, Core & Grading Framework:
The IB (non-profit educational foundation based in Geneva, Switzerland) offers four programmes globally (PYP, MYP, DP, CP), and Omega offers the rigorous IB Diploma Programme (IBDP) for ages 16–19 to prepare students for university and life beyond.
- 6 Subject Groups (HL/SL): Studies in Language & Literature, Language Acquisition, Individuals & Societies, Sciences, Mathematics, and The Arts/Electives.
- Grading & Score: Each subject is graded on a scale of 1 (min) to 7 (max). Maximum total score is 45 points, including up to 3 bonus points from the combination of the Extended Essay (EE) and Theory of Knowledge (TOK). Earning the Diploma requires a minimum total of 24 points and satisfactory completion of the three core requirements:
  1. Theory of Knowledge (TOK)
  2. Extended Essay (EE)
  3. Creativity, Activity, and Service (CAS): Activities have ranged from launching business ideas and contributing to mainstream newspapers to trekking, rock climbing, mural painting, and making products in the school's paper recycling plant.

University & Career Guidance:
Omega organizes campus visits by reputed Indian and foreign universities for one-on-one counsellor interactions and provides comprehensive college and career readiness support through the Naviance technology platform, backed by IB-certified facilitators undergoing ongoing annual professional development.

Admissions & EMI Options:
Admissions Open for 2027–2028 via https://www.hisomega.org/admissions/. Easy EMI options are available through GrayQuest for the IBDP Programme.`
  },
  {
    grade: 'NIOS',
    name: 'NIOS Stream Coordinator',
    tone: 'Friendly & Welcoming',
    knowledge: `National Institute of Open Schooling (NIOS) at Heartfulness International School, Omega Branch (HIS Omega)
Official Webpage: https://www.hisomega.org/nios-about-the-curriculum/
Official Government Portal: www.nios.ac.in
Campus: 79, Omega School Road (Pallavaram Road), Kolapakkam, Kovur Post, Chennai – 600128
Principal – NIOS: Radha Devi Sanku (B.E. (EEE), M.E. (CS), P.G.C.E.)
Working Hours: 7:45 AM – 3:10 PM (Monday to Friday; if working Saturdays: 7:45 AM – 12:30 PM)
Dress Code: Uniforms as prescribed
Academic Info Contact: Phone 044-66241122 | Email: principal.nios@hisomega.org
General Queries: Phone 044-66241105 / 044-66241130 | Email: info@hisomega.org | Admissions: https://www.hisomega.org/admissions/

Curriculum & Levels Offered:
NIOS is one of three National Boards of Secondary Education in India and the largest open school in the world, offering school education through Open and Distance Learning Mode with equivalence to other state/national boards for college and professional admissions. It develops its own curriculum, self-learning material, and media support programmes, empowering learners with flexibility and freedom to learn at their own pace.
At Heartfulness International School – Omega Branch, the NIOS stream is offered at three levels:
1. Open Basic Education (Grade 8 only)
2. Secondary Education Course (Grade 9 & 10)
3. Senior Secondary Education Course (Grade 11 & 12)

Admissions:
Admissions Open for 2027–2028 via https://www.hisomega.org/admissions/. Contact principal.nios@hisomega.org or 044-66241122 for academic guidance.`
  },
  {
    grade: 'Special Education',
    name: 'Special Needs Coordinator (Indigo)',
    tone: 'Empathetic & Supportive',
    knowledge: `Indigo Special Education Stream (Indigo Heartful Kids) at Heartfulness International School, Omega Branch (HIS Omega)
Official Webpage: https://www.hisomega.org/Indigo-about-the-curriculum/
Unit Head – Special Education (Indigo): Priti Venkatesan (B.Com. Hons, LLB, ACS, PGDBM, Dip. Early childhood education, Licensed Davis Facilitator (USA), DLS Mentor, NLP Practitioner, Certified Career Mentor)
Assistant Unit Head – Special Education (Indigo): Kavitha Rajagopalan (B.A., M.A., B.Ed. Eng, PGPDSE, M.Sc. Counselling & Psychotherapy, Montessori Trained, ADLD)
Working Hours: 7:45 AM – 3:10 PM (Monday to Friday; if working Saturdays: 7:45 AM – 12:30 PM)
Dress Code: Uniforms as prescribed
Academic Info Contact: Phone +91 94437 77230 | Email: pritiv@hisomega.org
General Queries: Phone 044-66241105 / 044-66241130 | Email: info@hisomega.org | Admissions: https://www.hisomega.org/admissions/

1. Vision & Hybrid Curriculum Framework:
The Indigo Heartful Kids curriculum integrates three complementary frameworks to nurture happy, independent, emotionally balanced learners through strength-based mastery rather than memorization:
- CBSE–NEP 2025–26 Components: Experiential hands-on learning, competency-based outcomes, multilingualism with Foundational Literacy & Numeracy (FLN), Life Skills, SEWA, Values Education, art-integrated and sports-integrated learning, flexible individualized pathways, and conceptual clarity over rote learning.
- CIE (Cambridge International) Components: Inquiry-based cycle (Engage–Explore–Reflect–Evaluate), Assessment for Learning (AfL), global perspectives, interdisciplinary themes, learner autonomy, metacognition, and conceptual progression in English, Math, Science, and Social Studies.
- Indigo + Davis Learning Strategies (DLS) Components: Davis Focusing Tools (Release, Focus, Energy Dial Setting), clay-based mastery of abstract concepts (Word → Meaning 3D clay model → Pronunciation), Individualized Education Plans (IEPs), experiential discovery (Experience → Wisdom → Understanding), Davis Life Concepts (Self, Change, Sequence, Consequence, Time, Symbiotic Relationships, Order & Disorder, Cause & Effect), and multisensory/visual-spatial/kinaesthetic design.

2. Curriculum Pillars & Cross-Curricular Elements:
- Pillar 1 (FLN): Phonological awareness, structured literacy, sight-word mastery through clay modeling, CVC/CVV/CVCe word building, concept-based numeracy with manipulatives, and Brighter Minds visualization & recall techniques.
- Pillar 2 (Conceptual Core Subjects): English Language (reading comprehension, grammar, creative expression, role-play), Mathematics (Concrete → Pictorial → Abstract progression, money/measurement/time/data), Science (observation, hands-on experiments, nature-study), and Social & Emotional Development via Davis Life Concepts.
- Cross-Curricular Elements: Clay modeling, Movement, Brain Gym, Yoga & Mudra Therapy, Sound Therapy for attention, Visualization & interoception, Art/Music/Theatre, Guided Inquiry & Student Portfolios, Sustainability & SEWA.

3. IEP Model, 7-Step Pedagogical Cycle & Annual Structure:
- IEP & Assessment: Baseline literacy/numeracy assessments, strength-based profiling (learning styles, MI profile, Davis profile), weekly learning adjustments, parent collaboration plans, and Diagnostic → Formative → Mastery Checks with portfolio-based tracking.
- 7-Step Pedagogical Cycle: (1) Prepare Mind & Body (Davis tools, visualization, breath work), (2) Experience-Based Introduction, (3) Inquiry & Exploration, (4) Concept Mastery (clay modeling + verbal explanation + mapping), (5) Practice & Application, (6) Reflection & Metacognition, (7) Assessment for Mastery.
- Annual Structure: Term 1 focuses on seating tolerance, following instructions, guided Davis Focusing Strategies, FLN, core concepts, and outdoor projects; Term 2 focuses on independent Davis Focusing Strategies, interdisciplinary projects, SEL, Symbiotic Relationships & Consequence, mastery assessments, and student showcases.`
  },
  {
    grade: 'Indigo',
    name: 'Indigo Special Education Coordinator',
    tone: 'Empathetic & Supportive',
    knowledge: `Indigo Special Education Stream (Indigo Heartful Kids) at Heartfulness International School, Omega Branch (HIS Omega)
Official Webpage: https://www.hisomega.org/Indigo-about-the-curriculum/
Unit Head – Special Education (Indigo): Priti Venkatesan (B.Com. Hons, LLB, ACS, PGDBM, Dip. Early childhood education, Licensed Davis Facilitator (USA), DLS Mentor, NLP Practitioner, Certified Career Mentor)
Assistant Unit Head – Special Education (Indigo): Kavitha Rajagopalan
Working Hours: 7:45 AM – 3:10 PM (Monday to Friday; if working Saturdays: 7:45 AM – 12:30 PM)
Dress Code: Uniforms as prescribed
Academic Info Contact: Phone +91 94437 77230 | Email: pritiv@hisomega.org
General Queries: Phone 044-66241105 / 044-66241130 | Email: info@hisomega.org | Admissions: https://www.hisomega.org/admissions/

Vision & Hybrid Curriculum Framework:
The Indigo Heartful Kids curriculum integrates CBSE–NEP 2025–26 competencies, Cambridge International (CIE) learning standards, and Indigo's neurocognitive and multisensory Davis Learning Strategies (DLS) approach (Davis Focusing Tools: Release, Focus, Energy Dial Setting; 3D clay modeling for Word → Meaning → Pronunciation; Davis Life Concepts: Self, Change, Sequence, Consequence, Time, Symbiotic Relationships, Order & Disorder, Cause & Effect).

Curriculum Pillars, Cross-Curricular Elements & IEP Model:
- Foundational Literacy & Numeracy (FLN): Structured literacy, clay sight-word mastery, manipulative numeracy, Brighter Minds visualization.
- Conceptual Core Subjects: English, Mathematics (Concrete → Pictorial → Abstract), Science enquiry & nature-study, Social & Emotional Development.
- Cross-Curricular: Clay modeling, Brain Gym, Yoga & Mudra Therapy, Sound Therapy, Art/Music/Theatre, SEWA.
- IEP & 7-Step Pedagogical Cycle: Baseline assessment, MI/Davis profiling, weekly adjustments, parent collaboration, Diagnostic → Formative → Mastery portfolio checks across Term 1 and Term 2.`
  }
];

export async function setupAgentsSchema() {
  console.log('--- Initializing HIS Omega Knowledge Base ---');
  try {
    for (const agent of HIS_OMEGA_AGENTS) {
      const existing = await query<Array<{ id: string }>>(
        'SELECT id FROM grade_agents WHERE student_grade = ? LIMIT 1;',
        [agent.grade]
      );

      if (existing && existing.length > 0) {
        await query(
          `UPDATE grade_agents 
           SET agent_name = ?,
               tone = ?,
               knowledge_text = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?;`,
          [agent.name, agent.tone, agent.knowledge, existing[0].id]
        );
        console.log(`Updated agent for: ${agent.grade}`);
      } else {
        await query(
          `INSERT INTO grade_agents (id, student_grade, agent_name, tone, knowledge_text, is_active)
           VALUES (?, ?, ?, ?, ?, TRUE);`,
          [randomUUID(), agent.grade, agent.name, agent.tone, agent.knowledge]
        );
        console.log(`Inserted agent for: ${agent.grade}`);
      }
    }
    console.log('All HIS Omega agents synchronized successfully!');
  } catch (err) {
    console.error('Error synchronizing agents:', err);
  }
}
