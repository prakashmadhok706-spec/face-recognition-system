file_path = r"CoopSyncAI\frontend\src\components\CoursesView.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update imports from api
old_api_import = "import { fetchCourses, createCourse, generateCertificate, updateStudentApi } from '../api';"
new_api_import = "import { fetchCourses, createCourse, generateCertificate, updateStudentApi, enrollCourseApi, fetchMyEnrollmentsApi, fetchCourseProgressApi, updateModuleProgressApi, completeCourseApi } from '../api';"
if old_api_import in text:
    text = text.replace(old_api_import, new_api_import, 1)

# 2. Replace state between activeCourseModal and loadCourses()
s_idx = text.find("const getStorageKey =")
e_idx = text.find("useEffect(() => {\n    loadCourses();")
assert s_idx != -1 and e_idx != -1, "slice indices not found"

new_state = """// Authoritative Backend Enrolled Courses State
  const [enrolledCourses, setEnrolledCourses] = useState<number[]>([]);
  const [courseProgressMap, setCourseProgressMap] = useState<Record<number, { progress_percentage: number; completed_modules: number; total_modules: number; status: string }>>({});
  const [activeCourseProgress, setActiveCourseProgress] = useState<any>(null);

  const loadEnrollments = async () => {
    try {
      const res = await fetchMyEnrollmentsApi();
      if (Array.isArray(res)) {
        const ids = res.map((item: any) => item.course_id);
        setEnrolledCourses(ids);
        const pMap: Record<number, any> = {};
        res.forEach((item: any) => {
          pMap[item.course_id] = {
            progress_percentage: item.progress_percentage,
            completed_modules: item.completed_modules,
            total_modules: item.total_modules,
            status: item.status
          };
        });
        setCourseProgressMap(pMap);
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

# 3. In loadCourses, also load enrollments
old_load = """  const loadCourses = async () => {
    try {
      const res = await fetchCourses();
      setCourses(res);
    } catch (e) {
      console.error(e);
    }
  };"""

new_load = """  const loadCourses = async () => {
    try {
      const res = await fetchCourses();
      setCourses(res);
      await loadEnrollments();
    } catch (e) {
      console.error(e);
    }
  };"""

if old_load in text:
    text = text.replace(old_load, new_load, 1)

# 4. Replace handleEnrollCourse
s_enroll = text.find("const handleEnrollCourse =")
e_enroll = text.find("// YouTube Mapping and Redirect Resolver", s_enroll)
assert s_enroll != -1 and e_enroll != -1, "enroll indices not found"

new_handle_enroll = """const handleEnrollCourse = async (courseId: number) => {
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
          updateStudentApi(currentUser.student_id, { skills: updatedSkillsStr }).catch(e => console.warn('Skills sync:', e));
        }
        setEnrollToast(`🎉 Successfully Enrolled in ${course?.title || 'the course'}! LMS Progress & Modules tracking initialized.`);
        setTimeout(() => setEnrollToast(null), 6000);
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        await loadEnrollments();
      }
    } catch (e) {
      console.error('Enroll error:', e);
    }
  };

  const handleOpenStudyModal = async (course: CourseItem) => {
    setActiveCourseModal(course);
    if (enrolledCourses.includes(course.id)) {
      try {
        const prog = await fetchCourseProgressApi(course.id);
        setActiveCourseProgress(prog);
      } catch (err) {
        console.error('Failed to load course modules progress:', err);
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

text = text[:s_enroll] + new_handle_enroll + text[e_enroll:]

# 5. In modal rendering: replace handleStudyCourse with handleOpenStudyModal
text = text.replace("handleStudyCourse(activeCourseModal)", "handleOpenStudyModal(activeCourseModal)")

# 6. Inside module item mapping, display real completion button and Claim Certificate button
old_badge_part = "style={{ fontSize: '0.7rem' }}\n                    >\n                      {moduleItem.status}\n                    </span>"
s_badge = text.find("<span\n                      className={`badge ${")
e_badge = text.find("</span>", s_badge) + 7
if s_badge != -1 and e_badge != -1:
    new_badge = """{activeCourseProgress && activeCourseProgress.modules ? (
                      (() => {
                        const mRecord = activeCourseProgress.modules.find((m: any) => m.module_id === (idx + 1));
                        const isDone = mRecord ? mRecord.is_completed : false;
                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleModuleComplete(activeCourseModal.id, idx + 1, isDone)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: isDone ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                              color: isDone ? '#34d399' : '#94a3b8',
                              border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {isDone ? <CheckCircle2 size={13} color="#34d399" /> : null}
                            {isDone ? 'Completed' : 'Mark Complete'}
                          </button>
                        );
                      })()
                    ) : (
                      <span
                        className={`badge ${
                          moduleItem.status === 'Completed'
                            ? 'badge-emerald'
                            : moduleItem.status === 'In Progress'
                            ? 'badge-indigo'
                            : 'badge-gold'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {moduleItem.status}
                      </span>
                    )}"""
    text = text[:s_badge] + new_badge + text[e_badge:]

# 7. In modal footer, show Claim Certificate button when progress is 100%
s_footer = text.find("{/* Modal Footer */}\n            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>")
if s_footer != -1:
    old_f_part = "{/* Modal Footer */}\n            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>\n              <button\n                type=\"button\"\n                onClick={() => setActiveCourseModal(null)}"
    new_f_part = """{/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div>
                {activeCourseProgress && (
                  <span style={{ fontSize: '0.82rem', color: activeCourseProgress.progress_percentage >= 100 ? '#34d399' : '#93c5fd', fontWeight: 600 }}>
                    LMS Progress: {activeCourseProgress.progress_percentage}% ({activeCourseProgress.completed_modules}/{activeCourseProgress.total_modules} Modules)
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {activeCourseProgress && activeCourseProgress.progress_percentage >= 100 && (
                  <button
                    type="button"
                    onClick={() => handleClaimCertificate(activeCourseModal.title)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '9px 18px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Award size={15} /> Claim Verified Certificate
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveCourseModal(null)}"""
    text = text.replace(old_f_part, new_f_part, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Successfully applied slice-based patch to CoursesView.tsx!")
