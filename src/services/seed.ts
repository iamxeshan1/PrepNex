import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function seedDefaultData(force: boolean = false) {
  try {
    if (!force && localStorage.getItem('prepnext_seed_done') === 'true') {
      return;
    }

    console.log(`[Seed Engine] Running seed (force=${force})...`);

    // 1. Agencies
    const agenciesSnap = await getDocs(collection(db, 'agencies'));
    if (agenciesSnap.size === 0 || force) {
      console.log("[Seed Engine] Seeding agencies...");
      const agencies = [
        { id: 'upsc', name: 'UPSC', description: 'Union Public Service Commission' },
        { id: 'ssc', name: 'SSC', description: 'Staff Selection Commission' },
        { id: 'banking', name: 'Banking', description: 'IBPS, SBI & RBI Examinations' },
        { id: 'railways', name: 'Railways', description: 'RRB NTPC & Group D' },
        { id: 'engineering', name: 'Engineering', description: 'JEE & GATE' },
        { id: 'medical', name: 'Medical', description: 'NEET UG & PG' }
      ];
      for (const agency of agencies) {
        await setDoc(doc(db, 'agencies', agency.id), agency, { merge: true });
      }
    }

    // 2. Subjects
    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    if (subjectsSnap.size === 0 || force) {
      console.log("[Seed Engine] Seeding subjects...");
      const subjects = [
        { id: 'gs', name: 'General Studies & Current Affairs', icon: 'Globe', description: 'History, Polity, Geography, Economy & Environment' },
        { id: 'quant', name: 'Quantitative Aptitude & Mathematics', icon: 'Calculator', description: 'Arithmetic, Algebra, Geometry & Data Interpretation' },
        { id: 'reasoning', name: 'Logical Reasoning & Analytical Ability', icon: 'Brain', description: 'Verbal & Non-Verbal Reasoning, Puzzles & Syllogism' },
        { id: 'english', name: 'English Language & Comprehension', icon: 'BookOpen', description: 'Grammar, Vocabulary, Reading Comprehension & Writing' },
        { id: 'science', name: 'General Science & Technology', icon: 'Atom', description: 'Physics, Chemistry, Biology & Space Tech' }
      ];
      for (const subject of subjects) {
        await setDoc(doc(db, 'subjects', subject.id), subject, { merge: true });
      }
    }

    // 3. Exams
    const examsSnap = await getDocs(collection(db, 'exams'));
    if (examsSnap.size === 0 || force) {
      console.log("[Seed Engine] Seeding exams...");
      const exams = [
        {
          id: 'upsc-cse',
          name: 'UPSC Civil Services Examination (IAS/IPS)',
          agencyId: 'upsc',
          description: 'Comprehensive test series for General Studies Paper I & II (CSAT) with AI performance analysis.',
          totalTests: 45,
          price: 2499,
          originalPrice: 4999,
          badge: 'Most Popular',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ssc-cgl',
          name: 'SSC CGL Tier I & II Complete Mock Series',
          agencyId: 'ssc',
          description: 'Complete sectional and full-length mock tests based on latest TCS pattern for Quantitative Aptitude, Reasoning, English & GK.',
          totalTests: 60,
          price: 1499,
          originalPrice: 2999,
          badge: 'Best Seller',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ibps-po',
          name: 'IBPS PO / SBI PO Prelims & Mains Mock Tests',
          agencyId: 'banking',
          description: 'Advanced banking aptitude, reasoning puzzles, data interpretation and current affairs test series.',
          totalTests: 50,
          price: 1299,
          originalPrice: 2499,
          badge: 'Trending',
          createdAt: new Date().toISOString()
        },
        {
          id: 'rrb-ntpc',
          name: 'RRB NTPC CBT 1 & CBT 2 Test Series',
          agencyId: 'railways',
          description: 'Full-length CBT mock tests with detailed solutions and speed enhancement analytics.',
          totalTests: 35,
          price: 999,
          originalPrice: 1999,
          badge: 'Value Pack',
          createdAt: new Date().toISOString()
        },
        {
          id: 'jee-advanced',
          name: 'JEE Advanced & Mains Mock Series',
          agencyId: 'engineering',
          description: 'High difficulty Physics, Chemistry, and Mathematics tests mirroring actual exam interface.',
          totalTests: 40,
          price: 1999,
          originalPrice: 3999,
          badge: 'Top Rated',
          createdAt: new Date().toISOString()
        },
        {
          id: 'neet-ug',
          name: 'NEET UG Full Syllabus Mock Tests',
          agencyId: 'medical',
          description: 'Physics, Chemistry and Biology chapter-wise & full mock tests as per latest NTA guidelines.',
          totalTests: 55,
          price: 1799,
          originalPrice: 3499,
          badge: 'Recommended',
          createdAt: new Date().toISOString()
        }
      ];

      for (const exam of exams) {
        await setDoc(doc(db, 'exams', exam.id), exam, { merge: true });
      }
    }

    // 4. Tests and Questions
    const testsSnap = await getDocs(collection(db, 'tests'));
    const questionsSnap = await getDocs(collection(db, 'questions'));
    if (testsSnap.size === 0 || questionsSnap.size === 0 || force) {
      console.log("[Seed Engine] Seeding tests and questions...");
      
      const examsList = [
        { id: 'upsc-cse', name: 'UPSC CSE' },
        { id: 'ssc-cgl', name: 'SSC CGL' },
        { id: 'ibps-po', name: 'IBPS PO' },
        { id: 'rrb-ntpc', name: 'RRB NTPC' },
        { id: 'jee-advanced', name: 'JEE Advanced' },
        { id: 'neet-ug', name: 'NEET UG' }
      ];

      const questionTemplates = [
        {
          subjectId: 'gs',
          question: "Which Article of the Indian Constitution provides for the establishment of the Finance Commission of India?",
          options: ["Article 280", "Article 312", "Article 324", "Article 110"],
          correctAnswer: "Article 280",
          level: "Medium",
          previouslyAskedIn: "UPSC CSE 2021",
          explanation: "Article 280 of the Constitution of India provides for the Finance Commission as a quasi-judicial body constituted by the President of India every five years."
        },
        {
          subjectId: 'gs',
          question: "The 'Preamble' to the Indian Constitution was amended by which Constitutional Amendment Act?",
          options: ["42nd Constitutional Amendment Act, 1976", "44th Constitutional Amendment Act, 1978", "86th Constitutional Amendment Act, 2002", "73rd Constitutional Amendment Act, 1992"],
          correctAnswer: "42nd Constitutional Amendment Act, 1976",
          level: "Easy",
          previouslyAskedIn: "SSC CGL 2020",
          explanation: "The 42nd Amendment Act of 1976 added three new words to the Preamble: Socialist, Secular, and Integrity."
        },
        {
          subjectId: 'quant',
          question: "If a sum of money doubles itself at compound interest in 5 years, in how many years will it become 8 times itself at the same rate?",
          options: ["15 years", "10 years", "20 years", "25 years"],
          correctAnswer: "15 years",
          level: "Medium",
          previouslyAskedIn: "IBPS PO 2022",
          explanation: "Sum doubles in 5 years ($2^1$ times in 5 yrs). So $8 = 2^3$ times will take $5 \\times 3 = 15$ years."
        },
        {
          subjectId: 'quant',
          question: "A train running at a speed of 72 km/h crosses a pole in 9 seconds. What is the length of the train in meters?",
          options: ["180 meters", "150 meters", "200 meters", "160 meters"],
          correctAnswer: "180 meters",
          level: "Easy",
          previouslyAskedIn: "RRB NTPC 2021",
          explanation: "Speed in m/s = $72 \\times \\frac{5}{18} = 20$ m/s. Distance = Speed $\\times$ Time = $20 \\times 9 = 180$ meters."
        },
        {
          subjectId: 'reasoning',
          question: "In a certain code language, 'PREPARATION' is written as 'QSFQBSBUPJO'. How will 'EXAMINATION' be written in that code?",
          options: ["FYBNJOBUJPJ", "FYBNJOBUJJO", "FYCMJOBUJJO", "EZBNJOBUJJO"],
          correctAnswer: "FYBNJOBUJJO",
          level: "Easy",
          previouslyAskedIn: "SSC CGL 2021",
          explanation: "Each letter is shifted forward by +1 position in alphabetical order."
        },
        {
          subjectId: 'reasoning',
          question: "Pointing to a photograph, a woman says: 'He is the son of the only daughter of my mother.' How is the man related to the woman?",
          options: ["Son", "Brother", "Nephew", "Father"],
          correctAnswer: "Son",
          level: "Medium",
          previouslyAskedIn: "SBI PO 2021",
          explanation: "The woman's mother's only daughter is the woman herself. So the man is her son."
        },
        {
          subjectId: 'english',
          question: "Select the most appropriate synonym for the word: 'METICULOUS'.",
          options: ["Painstaking / Precise", "Careless", "Hasty", "Superficial"],
          correctAnswer: "Painstaking / Precise",
          level: "Easy",
          previouslyAskedIn: "SSC CGL 2022",
          explanation: "Meticulous means showing great attention to detail; very careful and precise."
        },
        {
          subjectId: 'science',
          question: "Which phenomenon is responsible for the twinkling of stars in the night sky?",
          options: ["Atmospheric refraction of starlight", "Total internal reflection", "Dispersion of light", "Scattering of light"],
          correctAnswer: "Atmospheric refraction of starlight",
          level: "Easy",
          previouslyAskedIn: "NEET UG 2020",
          explanation: "Twinkling of stars is due to atmospheric refraction of starlight through varying air density layers."
        },
        {
          subjectId: 'science',
          question: "What is the acceleration due to gravity on the surface of the Earth at the poles compared to the equator?",
          options: ["Maximum at poles", "Minimum at poles", "Equal at both", "Zero at poles"],
          correctAnswer: "Maximum at poles",
          level: "Medium",
          previouslyAskedIn: "JEE Mains 2021",
          explanation: "The Earth is flattened at the poles, so the polar radius $R$ is smaller, making $g = \\frac{GM}{R^2}$ maximum at poles."
        },
        {
          subjectId: 'gs',
          question: "Who among the following presided over the historic Lahore Session of the Indian National Congress in 1929 where 'Purna Swaraj' was declared?",
          options: ["Jawaharlal Nehru", "Mahatma Gandhi", "Subhas Chandra Bose", "Sardar Vallabhbhai Patel"],
          correctAnswer: "Jawaharlal Nehru",
          level: "Medium",
          previouslyAskedIn: "UPSC Prelims 2019",
          explanation: "Jawaharlal Nehru presided over the 1929 Lahore Session where the resolution of complete independence ('Purna Swaraj') was adopted."
        }
      ];

      for (const exam of examsList) {
        for (let i = 1; i <= 4; i++) {
          const testId = `${exam.id}-mock-${i}`;
          const testData = {
            id: testId,
            examId: exam.id,
            title: `Mock Set 0${i}: Full Length All-India Paper`,
            duration: 120,
            totalQuestions: 10,
            totalMarks: 40,
            questionCount: 10,
            negativeMarking: 0.25,
            description: `Standard full-length mock test ${i} with comprehensive question bank and detailed performance breakdown for ${exam.name}.`,
            createdAt: new Date(Date.now() - i * 86400000).toISOString()
          };
          await setDoc(doc(db, 'tests', testId), testData, { merge: true });

          for (let q = 0; q < questionTemplates.length; q++) {
            const tmpl = questionTemplates[q];
            const qId = `${testId}-q-${q + 1}`;
            const qData = {
              id: qId,
              testId: testId,
              examId: exam.id,
              subjectId: tmpl.subjectId,
              question: tmpl.question,
              options: tmpl.options,
              correctAnswer: tmpl.correctAnswer,
              level: tmpl.level,
              previouslyAskedIn: tmpl.previouslyAskedIn,
              explanation: tmpl.explanation,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'questions', qId), qData, { merge: true });
          }
        }
      }
    }

    // 5. Live Tests
    const liveTestsSnap = await getDocs(collection(db, 'liveTests'));
    if (liveTestsSnap.size === 0 || force) {
      console.log("[Seed Engine] Seeding live tests...");
      const liveTests = [
        {
          id: 'live-test-1',
          title: 'All India UPSC Prelims 2026 Open Mock',
          examId: 'upsc-cse',
          duration: 120,
          totalQuestions: 50,
          totalMarks: 200,
          questionCount: 10,
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
          participantsCount: 1420
        },
        {
          id: 'live-test-2',
          title: 'SSC CGL Tier-1 Mega Scholarship Test',
          examId: 'ssc-cgl',
          duration: 60,
          totalQuestions: 100,
          totalMarks: 200,
          questionCount: 10,
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 172800000).toISOString(),
          status: 'upcoming',
          participantsCount: 3850
        }
      ];

      for (const lt of liveTests) {
        await setDoc(doc(db, 'liveTests', lt.id), lt, { merge: true });
      }
    }

    // 6. Study Material / Ebooks
    const materialsSnap = await getDocs(collection(db, 'study_material'));
    if (materialsSnap.size === 0 || force) {
      console.log("[Seed Engine] Seeding study materials...");
      const materials = [
        {
          id: 'mat-1',
          title: 'Complete Indian Polity & Constitution Masterclass Notes',
          examId: 'upsc-cse',
          category: 'PDF Notes',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          downloads: 4210,
          createdAt: new Date().toISOString()
        },
        {
          id: 'mat-2',
          title: 'Quantitative Aptitude Formula Handbook for SSC & Banking',
          examId: 'ssc-cgl',
          category: 'Formula Handbook',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          downloads: 6520,
          createdAt: new Date().toISOString()
        }
      ];

      for (const mat of materials) {
        await setDoc(doc(db, 'study_material', mat.id), mat, { merge: true });
      }
    }

    // 7. Broadcasting Channels
    const channelsSnap = await getDocs(collection(db, 'broadcasting_channels'));
    if (channelsSnap.size === 0 || force) {
      console.log("[Seed Engine] Seeding broadcasting channels...");
      const channels = [
        {
          id: 'announcements',
          name: 'PrepNext Official Announcements',
          description: 'Official notifications, exam updates, and important alerts.',
          icon: 'Megaphone',
          createdAt: new Date().toISOString()
        },
        {
          id: 'current-affairs',
          name: 'Daily Current Affairs & Editorials',
          description: 'Daily editorial analysis and current affairs for aspirants.',
          icon: 'Globe',
          createdAt: new Date().toISOString()
        }
      ];

      for (const ch of channels) {
        await setDoc(doc(db, 'broadcasting_channels', ch.id), ch, { merge: true });
      }
    }

    // 8. Job Alerts
    const jobAlertsSnap = await getDocs(collection(db, 'jobAlerts'));
    if (jobAlertsSnap.size === 0 || force) {
      console.log("[Seed Engine] Seeding job alerts...");
      const jobAlerts = [
        {
          id: 'job-1',
          title: 'UPSC Civil Services 2026 Notification Released',
          organization: 'UPSC',
          qualification: 'Graduate',
          lastDate: '2026-05-30',
          applyUrl: 'https://upsc.gov.in',
          description: 'Union Public Service Commission has released notification for 1,056 vacancies.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'job-2',
          title: 'SSC CGL 2026 Recruitment for 12,000+ Posts',
          organization: 'SSC',
          qualification: 'Graduate',
          lastDate: '2026-06-15',
          applyUrl: 'https://ssc.nic.in',
          description: 'Staff Selection Commission invites online applications for Combined Graduate Level Examination.',
          createdAt: new Date().toISOString()
        }
      ];

      for (const job of jobAlerts) {
        await setDoc(doc(db, 'jobAlerts', job.id), job, { merge: true });
      }
    }

    // 9. Users / Aspirant Profiles
    const usersSnap = await getDocs(collection(db, 'users'));
    const hasSeededUsers = usersSnap.docs.some(d => d.id.startsWith('user-'));
    if (usersSnap.size <= 1 || !hasSeededUsers || force) {
      console.log("[Seed Engine] Seeding aspirant users into user directory...");
      const mockUsers = [
        {
          uid: 'user-rahul-01',
          userId: 'user-rahul-01',
          fullName: 'Rahul Sharma',
          name: 'Rahul Sharma',
          username: 'rahul_upsc',
          email: 'rahul.sharma@example.com',
          phone: '+91 98765 43210',
          role: 'aspirant',
          targetExam: 'UPSC Civil Services',
          state: 'Delhi',
          address: 'Connaught Place, New Delhi',
          isPremium: true,
          points: 1850,
          streakDays: 14,
          testsAttempted: 28,
          averageScore: 84.5,
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          lastLogin: new Date(Date.now() - 2 * 3600000).toISOString(),
          isOnline: true
        },
        {
          uid: 'user-priya-02',
          userId: 'user-priya-02',
          fullName: 'Priya Verma',
          name: 'Priya Verma',
          username: 'priya_ssc',
          email: 'priya.verma@example.com',
          phone: '+91 98123 45678',
          role: 'aspirant',
          targetExam: 'SSC CGL',
          state: 'Uttar Pradesh',
          address: 'Hazratganj, Lucknow',
          isPremium: true,
          points: 2100,
          streakDays: 21,
          testsAttempted: 35,
          averageScore: 89.2,
          createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
          lastLogin: new Date(Date.now() - 15 * 60000).toISOString(),
          isOnline: true
        },
        {
          uid: 'user-amit-03',
          userId: 'user-amit-03',
          fullName: 'Amit Patel',
          name: 'Amit Patel',
          username: 'patel_banker',
          email: 'amit.patel@example.com',
          phone: '+91 97234 56789',
          role: 'aspirant',
          targetExam: 'IBPS PO',
          state: 'Gujarat',
          address: 'CG Road, Ahmedabad',
          isPremium: false,
          points: 1620,
          streakDays: 9,
          testsAttempted: 22,
          averageScore: 81.0,
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          lastLogin: new Date(Date.now() - 5 * 3600000).toISOString(),
          isOnline: false
        },
        {
          uid: 'user-sneha-04',
          userId: 'user-sneha-04',
          fullName: 'Sneha Reddy',
          name: 'Sneha Reddy',
          username: 'sneha_neet',
          email: 'sneha.reddy@example.com',
          phone: '+91 96543 21098',
          role: 'aspirant',
          targetExam: 'NEET UG',
          state: 'Telangana',
          address: 'Banjara Hills, Hyderabad',
          isPremium: true,
          points: 2450,
          streakDays: 30,
          testsAttempted: 42,
          averageScore: 92.4,
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          lastLogin: new Date().toISOString(),
          isOnline: true
        },
        {
          uid: 'user-vikram-05',
          userId: 'user-vikram-05',
          fullName: 'Vikram Singh',
          name: 'Vikram Singh',
          username: 'vikram_jee',
          email: 'vikram.singh@example.com',
          phone: '+91 95432 10987',
          role: 'aspirant',
          targetExam: 'JEE Advanced',
          state: 'Rajasthan',
          address: 'Malviya Nagar, Jaipur',
          isPremium: false,
          points: 1980,
          streakDays: 18,
          testsAttempted: 31,
          averageScore: 86.0,
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          lastLogin: new Date(Date.now() - 1 * 86400000).toISOString(),
          isOnline: false
        },
        {
          uid: 'user-ananya-06',
          userId: 'user-ananya-06',
          fullName: 'Ananya Roy',
          name: 'Ananya Roy',
          username: 'ananya_wbcs',
          email: 'ananya.roy@example.com',
          phone: '+91 94321 09876',
          role: 'aspirant',
          targetExam: 'WBCS Executive',
          state: 'West Bengal',
          address: 'Park Street, Kolkata',
          isPremium: true,
          points: 2310,
          streakDays: 25,
          testsAttempted: 38,
          averageScore: 88.7,
          createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
          lastLogin: new Date(Date.now() - 30 * 60000).toISOString(),
          isOnline: true
        },
        {
          uid: 'user-rohan-07',
          userId: 'user-rohan-07',
          fullName: 'Rohan Deshmukh',
          name: 'Rohan Deshmukh',
          username: 'rohan_mpsc',
          email: 'rohan.deshmukh@example.com',
          phone: '+91 93210 98765',
          role: 'aspirant',
          targetExam: 'MPSC Rajyaseva',
          state: 'Maharashtra',
          address: 'Kothrud, Pune',
          isPremium: false,
          points: 1750,
          streakDays: 12,
          testsAttempted: 26,
          averageScore: 82.3,
          createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
          lastLogin: new Date(Date.now() - 4 * 3600000).toISOString(),
          isOnline: false
        }
      ];

      for (const u of mockUsers) {
        try {
          await setDoc(doc(db, 'users', u.uid), u, { merge: true });
        } catch (e) {
          console.warn("[Seed Engine] Skipping user doc write:", e);
        }
      }
    }

    localStorage.setItem('prepnext_seed_done', 'true');
    console.log("[Seed Engine] Seeding run completed successfully!");
  } catch (err) {
    console.error("[Seed Engine] Error seeding default data:", err);
  }
}
