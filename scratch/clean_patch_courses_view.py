with open(r"CoopSyncAI\frontend\src\components\CoursesView.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update imports
old_imp = "import { fetchCourses, createCourse, generateCertificate, updateStudentApi } from '../api';"
new_imp = "import { fetchCourses, createCourse, generateCertificate, updateStudentApi, enrollCourseApi, fetchMyEnrollmentsApi, fetchCourseProgressApi, updateModuleProgressApi } from '../api';"
assert old_imp in text, "old_imp not found"
text = text.replace(old_imp, new_imp, 1)

# 2. Replace localStorage state
s_token = "  // Persistent Enrolled Courses State in localStorage"
e_token = "  useEffect(() => {\n    loadCourses();"
s_idx = text.find(s_token)
e_idx = text.find(e_token)
assert s_idx != -1 and e_idx != -1, "state indices not found"

new_state = """  // Authoritative LMS Enrollment State from Backend API
  const [enrolledCourses, setEnrolledCourses] = useState<number[]>([]);
  const [activeCourseProgress, setActiveCourseProgress] = useState<any>(null);

  const loadEnrollments = async () => {
    try {
      const res = await fetchMyEnrollmentsApi();
      if (Array.isArray(res)) {
        const ids = res.map((item: any) => item.course_id);
        setEnrolledCourses(ids);
      }
    } catch (e) {
      console.error('Failed to load student enrollments:', e);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, [currentUser.student_id]);

"""
text = text[:s_idx] + new_state + text[e_idx:]

# 3. Replace handleEnrollCourse
s_enroll = "  const handleEnrollCourse = (courseId: number) => {"
e_enroll = "  // YouTube Mapping and Redirect Resolver"
s_e_idx = text.find(s_enroll)
e_e_idx = text.find(e_enroll)
assert s_e_idx != -1 and e_e_idx != -1, "enroll indices not found"

new_enroll_fn = """  const handleEnrollCourse = async (courseId: number) => {
    try {
      const res = await enrollCourseApi(courseId);
      if (res && (res.success || res.enrollment)) {
        setEnrolledCourses(prev => Array.from(new Set([...prev, courseId])));
        const course = courses.find(c => c.id === courseId);
        if (course && currentUser.student_id) {
          const courseSkills = getSkillsForCourse(course);
          const currentSkillsArr = currentUser.skills 
            ? currentUser.skills.split(',').map(s => s.trim()).filter(Boolean)
            : [];
          const combined = Array.from(new Set([...currentSkillsArr, ...courseSkills]));
          const updatedSkillsStr = combined.join(', ');
          
          currentUser.skills = updatedSkillsStr;
          updateStudentApi(currentUser.student_id, { skills: updatedSkillsStr })
            .then(() => {
              setEnrollToast(`🎉 Successfully Enrolled in ${course.title}! LMS Progress & Modules tracking initialized.`);
              setTimeout(() => setEnrollToast(null), 6000);
            })
            .catch(e => console.warn('Skills update error:', e));
        }
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        await loadEnrollments();
      }
    } catch (e) {
      console.error('Enrollment error:', e);
    }
  };

  const handleStudyCourse = async (course: CourseItem) => {
    setActiveCourseModal(course);
    if (enrolledCourses.includes(course.id)) {
      try {
        const prog = await fetchCourseProgressApi(course.id);
        setActiveCourseProgress(prog);
      } catch (err) {
        console.warn('Progress load warning:', err);
      }
    } else {
      setActiveCourseProgress(null);
    }
  };

  const handleToggleModuleComplete = async (courseId: number, moduleId: number, currentCompleted: boolean) => {
    try {
      const res = await updateModuleProgressApi(courseId, moduleId, { is_completed: !currentCompleted, time_spent_minutes: 20 });
      if (res && res.success) {
        const updated = await fetchCourseProgressApi(courseId);
        setActiveCourseProgress(updated);
        await loadEnrollments();
        if (res.progress_percentage >= 100) {
          confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
        }
      }
    } catch (err) {
      console.error('Module update error:', err);
    }
  };

  const handleClaimCertificate = async (courseTitle: string) => {
    try {
      const res = await generateCertificate(currentUser.name, courseTitle);
      if (res && res.success) {
        setEnrollToast(`🎓 Authentic Digital Certificate Issued! Available under your verified credentials.`);
        setTimeout(() => setEnrollToast(null), 6000);
        confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 } });
      } else {
        alert(res?.detail || res?.message || 'Could not claim certificate.');
      }
    } catch (err: any) {
      alert(err.message || 'Error claiming certificate.');
    }
  };

"""
text = text[:s_e_idx] + new_enroll_fn + text[e_e_idx:]

with open(r"CoopSyncAI\frontend\src\components\CoursesView.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Applied CoursesView updates cleanly!")

