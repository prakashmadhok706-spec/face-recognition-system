import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Clock, 
  PlayCircle, 
  CheckCircle, 
  FileText, 
  Sparkles 
} from 'lucide-react';
import { fetchCourses, createCourse } from '../api';
import { CourseItem, UserProfile } from '../types';

interface CoursesViewProps {
  currentUser: UserProfile;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ currentUser }) => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('AI & Computer Vision');
  const [newTrainer, setNewTrainer] = useState<string>(currentUser.name);
  const [newDuration, setNewDuration] = useState<string>('6 Weeks');
  const [newDesc, setNewDesc] = useState<string>('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetchCourses();
      setCourses(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      await createCourse({
        title: newTitle,
        category: newCategory,
        trainer_name: newTrainer || currentUser.name,
        duration: newDuration,
        description: newDesc
      });
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      loadCourses();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderLeft: '4px solid #6366f1'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>
              Cooperative Training & Academic Modules
            </h2>
            <span className="badge badge-indigo">
              <BookOpen size={12} /> Curriculum Portal
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
            Comprehensive capacity building programs in Artificial Intelligence, Computer Vision biometrics, 
            cooperative accounts, and modern agri-business ERP management.
          </p>
        </div>

        {/* Create Course button (Trainer/Admin) */}
        <button
          onClick={() => setShowModal(true)}
          className="gradient-btn"
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> Create New Course
        </button>
      </div>

      {/* Courses Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {courses.map((course) => (
          <div key={course.id} className="glass-card-interactive" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Thumbnail */}
            <div style={{ position: 'relative', height: '170px', width: '100%', overflow: 'hidden' }}>
              <img
                src={course.thumbnail}
                alt={course.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span className="badge badge-indigo" style={{ position: 'absolute', top: '12px', left: '12px', backdropFilter: 'blur(8px)' }}>
                {course.category}
              </span>
            </div>

            {/* Content */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', lineHeight: 1.3 }}>
                {course.title}
              </h3>
              
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
                {course.description}
              </p>

              {/* Meta row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '10px'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} color="#38bdf8" /> {course.enrolled_count} Students Enrolled
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} color="#a855f7" /> {course.duration}
                </span>
              </div>

              {/* Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Classroom Completion</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{course.progress_percentage}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${course.progress_percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #10b981)'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  className="gradient-btn"
                  style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                  onClick={() => alert(`Starting lecture modules for ${course.title}`)}
                >
                  <PlayCircle size={14} /> View Modules ({course.modules_count})
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Course Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Create Cooperative Course</h3>
            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Face Biometrics in Agriculture"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Duration</label>
                <input
                  type="text"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Course syllabus and capacity building objectives..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="gradient-btn" style={{ flex: 1, padding: '10px' }}>
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
