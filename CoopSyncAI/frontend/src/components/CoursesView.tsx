import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Clock, 
  PlayCircle, 
  CheckCircle, 
  FileText, 
  Sparkles,
  Search,
  Filter,
  GraduationCap,
  Layers,
  Award,
  ChevronRight,
  X,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Play,
  Image as ImageIcon
} from 'lucide-react';
import { fetchCourses, createCourse, generateCertificate, updateStudentApi } from '../api';
import { CourseItem, UserProfile } from '../types';
import confetti from 'canvas-confetti';

const YoutubeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, verticalAlign: 'middle' }}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" fill={color} />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
  </svg>
);

interface CoursesViewProps {
  currentUser: UserProfile;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ currentUser }) => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Create Course Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Computer Engineering (Core)');
  const [newTrainer, setNewTrainer] = useState<string>(currentUser.name);
  const [newDuration, setNewDuration] = useState<string>('8 Weeks');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newYtUrl, setNewYtUrl] = useState<string>('');
  const [newThumbnail, setNewThumbnail] = useState<string>('');
  const [enrollToast, setEnrollToast] = useState<string | null>(null);

  // Extract YouTube Video ID & Thumbnail
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:v=|\/|embed\/|youtu\.be\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const vidId = extractYouTubeId(url);
    return vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : null;
  };

  // Map course title and category to technical competencies/skills
  const getSkillsForCourse = (course: CourseItem): string[] => {
    const t = (course.title || '').toLowerCase();
    const c = (course.category || '').toLowerCase();
    if (t.includes('data structures') || t.includes('dsa')) return ['Data Structures', 'Algorithms', 'C++'];
    if (t.includes('operating systems') || t.includes('os')) return ['Operating Systems', 'Linux Kernel', 'C'];
    if (t.includes('database') || t.includes('dbms') || t.includes('sql')) return ['PostgreSQL', 'SQL', 'Database Design'];
    if (t.includes('network')) return ['Computer Networks', 'TCP/IP', 'Sockets'];
    if (t.includes('artificial intelligence') || t.includes('deep learning') || t.includes('computer vision') || t.includes('face biometrics')) {
      return ['OpenCV', 'PyTorch', 'Computer Vision', 'Deep Learning'];
    }
    if (t.includes('full-stack') || t.includes('software engineering') || t.includes('web')) {
      return ['React', 'TypeScript', 'FastAPI', 'REST APIs'];
    }
    if (t.includes('cybersecurity') || t.includes('cryptography')) return ['Cybersecurity', 'Cryptography', 'Network Security'];
    if (t.includes('cloud') || t.includes('devops')) return ['AWS Cloud', 'Docker', 'CI/CD'];
    if (c.includes('ai') || c.includes('vision')) return ['OpenCV', 'Machine Learning', 'Python'];
    if (c.includes('software')) return ['Software Engineering', 'System Design', 'Git'];
    return ['Python', 'Software Engineering'];
  };

  // Course Syllabus / Modules Modal State
  const [activeCourseModal, setActiveCourseModal] = useState<CourseItem | null>(null);
  
  // Persistent Enrolled Courses State in localStorage — keyed per student
  const getStorageKey = (userId: string) => `coopsync_enrolled_courses_${userId}`;

  const [enrolledCourses, setEnrolledCourses] = useState<number[]>(() => {
    try {
      const key = getStorageKey(currentUser.student_id);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reload enrolled courses when currentUser changes
  useEffect(() => {
    try {
      const key = getStorageKey(currentUser.student_id);
      const saved = localStorage.getItem(key);
      setEnrolledCourses(saved ? JSON.parse(saved) : []);
    } catch {
      setEnrolledCourses([]);
    }
  }, [currentUser.student_id]);

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
      const autoThumb = getYouTubeThumbnail(newYtUrl);
      const thumbToUse = newThumbnail.trim() || autoThumb || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600";
      await createCourse({
        title: newTitle,
        category: newCategory,
        trainer_name: newTrainer || currentUser.name,
        duration: newDuration,
        description: newDesc,
        youtube_url: newYtUrl,
        thumbnail: thumbToUse
      });
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewYtUrl('');
      setNewThumbnail('');
      loadCourses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnrollCourse = (courseId: number) => {
    setEnrolledCourses(prev => {
      if (!prev.includes(courseId)) {
        const next = [...prev, courseId];
        try {
          const key = getStorageKey(currentUser.student_id);
          localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {
          console.warn('Storage save error:', e);
        }
        
        const course = courses.find(c => c.id === courseId);
        if (course) {
          // 1. Auto-generate certificate for this student + course
          generateCertificate(currentUser.name, course.title)
            .then(() => console.log(`Certificate generated for ${currentUser.name} – ${course.title}`))
            .catch(e => console.warn('Certificate generation error:', e));

          // 2. Auto-update student skills in ERP Capacity profile & SQLite database
          if (currentUser.student_id) {
            const courseSkills = getSkillsForCourse(course);
            const currentSkillsArr = currentUser.skills 
              ? currentUser.skills.split(',').map(s => s.trim()).filter(Boolean)
              : [];
            const combined = Array.from(new Set([...currentSkillsArr, ...courseSkills]));
            const updatedSkillsStr = combined.join(', ');
            
            currentUser.skills = updatedSkillsStr;
            updateStudentApi(currentUser.student_id, { skills: updatedSkillsStr })
              .then((res) => {
                console.log('Student skills updated via course enrollment:', res);
                setEnrollToast(`🎉 Successfully Enrolled in ${course.title}! Updated Capacity Profile Tech Stack with: ${courseSkills.join(', ')}`);
                setTimeout(() => setEnrollToast(null), 7000);
              })
              .catch(e => console.warn('Skills update error:', e));
          }
        }
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        return next;
      }
      return prev;
    });
  };

  // YouTube Mapping and Redirect Resolver
  const getCourseYouTubeUrl = (course: CourseItem): string => {
    if (course.youtube_url && course.youtube_url.startsWith('http')) {
      return course.youtube_url;
    }
    const title = course.title.toLowerCase();
    if (title.includes('data structures') || title.includes('dsa')) {
      return 'https://www.youtube.com/watch?v=8hly31xKli0'; // freeCodeCamp DSA Full Course
    } else if (title.includes('operating systems')) {
      return 'https://www.youtube.com/watch?v=26QPDBe-NB8'; // Neso Academy OS Course
    } else if (title.includes('database') || title.includes('dbms')) {
      return 'https://www.youtube.com/watch?v=HXV3zeQKqGY'; // freeCodeCamp Database Design & SQL
    } else if (title.includes('computer networks') || title.includes('network')) {
      return 'https://www.youtube.com/watch?v=IPvYjXCsTg8'; // freeCodeCamp Computer Networking
    } else if (title.includes('artificial intelligence') || title.includes('deep learning')) {
      return 'https://www.youtube.com/watch?v=GIsg-ZUy0MY'; // freeCodeCamp PyTorch Deep Learning
    } else if (title.includes('full-stack') || title.includes('software engineering')) {
      return 'https://www.youtube.com/watch?v=nu_pCVPKzTk'; // freeCodeCamp Full Stack Web Dev
    } else if (title.includes('cybersecurity') || title.includes('cryptography')) {
      return 'https://www.youtube.com/watch?v=U_P23SqJaDc'; // freeCodeCamp Cybersecurity Full Course
    } else if (title.includes('cloud') || title.includes('devops')) {
      return 'https://www.youtube.com/watch?v=SqcXvc3ZmRU'; // freeCodeCamp AWS Cloud Practitioner
    } else if (title.includes('object-oriented') || title.includes('design patterns')) {
      return 'https://www.youtube.com/watch?v=v9ejT8FO-7I'; // freeCodeCamp OOP Principles
    } else if (title.includes('vision') || title.includes('face biometrics')) {
      return 'https://www.youtube.com/watch?v=oXlwWbU8l2o'; // freeCodeCamp OpenCV Computer Vision
    } else if (title.includes('accounting') || title.includes('erp')) {
      return 'https://www.youtube.com/watch?v=yYX4bvQSqbo'; // Accounting & ERP Foundations
    } else if (title.includes('agri') || title.includes('iot')) {
      return 'https://www.youtube.com/watch?v=QSIPNhOiMoE'; // IoT & Smart Systems
    }
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(course.title + ' full course tutorial')}`;
  };

  // Study Button Handler: Redirects directly to the YouTube lecture video
  const handleStudyCourse = (course: CourseItem) => {
    const url = getCourseYouTubeUrl(course);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getModuleYouTubeUrl = (course: CourseItem, moduleTitle: string): string => {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(course.title + ' ' + moduleTitle)}`;
  };

  const getCourseSyllabus = (course: CourseItem) => {
    const titleLower = course.title.toLowerCase();
    if (titleLower.includes('data structures') || titleLower.includes('dsa')) {
      return [
        { mod: 'Module 1', title: 'Asymptotic Complexity Analysis & C++/Java STL Containers', hours: '6 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'Linear Structures: Linked Lists, Stacks, Queues & Monotonic Stacks', hours: '8 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'Trees, Binary Search Trees, Heaps & Priority Queues', hours: '10 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'Advanced Graph Algorithms: BFS, DFS, Dijkstra, Bellman-Ford & Kruskal', hours: '12 hrs', status: 'Upcoming' },
        { mod: 'Module 5', title: 'Dynamic Programming, Memoization & LeetCode Hard Patterns', hours: '14 hrs', status: 'Upcoming' }
      ];
    } else if (titleLower.includes('operating systems')) {
      return [
        { mod: 'Module 1', title: 'Operating System Architecture, Kernel Modes & POSIX System Calls', hours: '5 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'CPU Scheduling Algorithms, Context Switching & Process Lifecycle', hours: '8 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'Concurrency, Semaphores, Mutex Locks & Deadlock Avoidance', hours: '9 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'Virtual Memory, Multi-level Paging & Page Replacement Algorithms', hours: '10 hrs', status: 'Upcoming' },
        { mod: 'Module 5', title: 'File System Implementation, Disk Scheduling & Linux VFS', hours: '8 hrs', status: 'Upcoming' }
      ];
    } else if (titleLower.includes('database') || titleLower.includes('dbms')) {
      return [
        { mod: 'Module 1', title: 'Relational Model, ER Diagrams & Normalization (1NF to BCNF)', hours: '6 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'PostgreSQL Advanced Queries: Joins, Window Functions & CTEs', hours: '8 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'ACID Properties, Transaction Concurrency & Isolation Levels', hours: '7 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'B-Tree & Hash Indexing, EXPLAIN Query Plans & Sharding', hours: '9 hrs', status: 'Upcoming' },
        { mod: 'Module 5', title: 'NoSQL Distributed Systems: MongoDB, Redis Caching & CAP Theorem', hours: '8 hrs', status: 'Upcoming' }
      ];
    } else if (titleLower.includes('network')) {
      return [
        { mod: 'Module 1', title: 'OSI 7-Layer Architecture & TCP/IP Model Overview', hours: '6 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'IP Addressing, Subnetting (CIDR), NAT, ARP & Routing Protocols', hours: '8 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'Transport Layer: TCP 3-Way Handshake, Flow Control & UDP', hours: '8 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'Application Layer: HTTP/2, HTTP/3, TLS Encryption, DNS & Sockets', hours: '10 hrs', status: 'Upcoming' },
        { mod: 'Module 5', title: 'Distributed Systems: RPCs, Microservices Consensus & CDN Delivery', hours: '8 hrs', status: 'Upcoming' }
      ];
    } else if (titleLower.includes('artificial intelligence') || titleLower.includes('deep learning') || titleLower.includes('computer vision')) {
      return [
        { mod: 'Module 1', title: 'Computer Vision Core: OpenCV Image Filters, Haar Cascades & LBPH', hours: '8 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'Biometric Anti-Spoofing: Laplacian Texture Frequency & Liveness Analysis', hours: '8 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'Neural Networks: Forward Propagation, Cross-Entropy Loss & Backprop', hours: '10 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'Convolutional Neural Networks (CNNs) & FaceNet Feature Embeddings', hours: '12 hrs', status: 'Upcoming' },
        { mod: 'Module 5', title: 'Production Edge Inference & FastAPI Biometrics Microservices', hours: '10 hrs', status: 'Upcoming' }
      ];
    } else if (titleLower.includes('full-stack') || titleLower.includes('software engineering')) {
      return [
        { mod: 'Module 1', title: 'Frontend Architecture: React 19, TypeScript, Modular Hooks & Vite', hours: '8 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'Backend REST API Engineering with Python FastAPI & Pydantic Schemas', hours: '10 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'Authentication Systems: JWT Bearer Tokens & Password Hashing', hours: '7 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'Database Integration: SQLAlchemy ORM, Migrations & SQLite/Postgres', hours: '8 hrs', status: 'Upcoming' },
        { mod: 'Module 5', title: 'Containerization, Docker Compose & Production CI/CD Deployment', hours: '9 hrs', status: 'Upcoming' }
      ];
    } else if (titleLower.includes('cybersecurity') || titleLower.includes('cryptography')) {
      return [
        { mod: 'Module 1', title: 'Information Security Principles, Threat Modeling & OWASP Top 10', hours: '6 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'Symmetric & Asymmetric Cryptography: AES, RSA & Diffie-Hellman', hours: '8 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'Cryptographic Hashing: SHA-256, Dynamic Salt Rotation & Passwords', hours: '7 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'Network Penetration Testing, Wireshark Packet Analysis & Firewalls', hours: '9 hrs', status: 'Upcoming' },
        { mod: 'Module 5', title: 'Zero Trust Security Architectures & Enterprise Identity Management', hours: '8 hrs', status: 'Upcoming' }
      ];
    } else if (titleLower.includes('cloud') || titleLower.includes('devops')) {
      return [
        { mod: 'Module 1', title: 'Cloud Computing Foundations: AWS Core Services (EC2, S3, RDS, VPC)', hours: '6 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'Containerization with Docker & Multi-Stage Production Builds', hours: '7 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'Kubernetes Cluster Architecture: Pods, Services, Deployments & Ingress', hours: '10 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'Infrastructure as Code (IaC) using Terraform & CloudFormation', hours: '8 hrs', status: 'Upcoming' },
        { mod: 'Module 5', title: 'CI/CD Pipelines: GitHub Actions, Automated Testing & Monitoring', hours: '8 hrs', status: 'Upcoming' }
      ];
    } else if (titleLower.includes('object-oriented') || titleLower.includes('design patterns')) {
      return [
        { mod: 'Module 1', title: 'Object-Oriented Fundamentals, Abstraction & Polymorphism in Depth', hours: '5 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'SOLID Principles & Clean Code Architecture Practices', hours: '7 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'Creational & Structural Patterns: Factory, Singleton, Adapter, Decorator', hours: '8 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'Behavioral Patterns: Observer, Strategy, Command & State Machines', hours: '8 hrs', status: 'Upcoming' },
        { mod: 'Module 5', title: 'System Design Interview Case Studies: URL Shortener & Cache Design', hours: '10 hrs', status: 'Upcoming' }
      ];
    } else {
      return [
        { mod: 'Module 1', title: 'Curriculum Foundations & Core Technical Concepts', hours: '4 hrs', status: 'Completed' },
        { mod: 'Module 2', title: 'Applied Methodologies, System Tooling & Architecture', hours: '6 hrs', status: 'In Progress' },
        { mod: 'Module 3', title: 'Hands-on Engineering Practicals & Laboratory Exercises', hours: '8 hrs', status: 'Upcoming' },
        { mod: 'Module 4', title: 'Industry Best Practices, Evaluation & Capstone Project', hours: '8 hrs', status: 'Upcoming' }
      ];
    }
  };

  const filteredCourses = courses.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = c.title.toLowerCase().includes(query) ||
                          c.description.toLowerCase().includes(query) ||
                          c.trainer_name.toLowerCase().includes(query) ||
                          c.category.toLowerCase().includes(query);
    
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'ce_core') {
      return c.category.includes('Core') || c.title.includes('DSA') || c.title.includes('Operating') || c.title.includes('Database') || c.title.includes('Object-Oriented');
    }
    if (selectedCategory === 'ai_ml') {
      return c.category.includes('AI') || c.title.includes('Artificial') || c.title.includes('Vision');
    }
    if (selectedCategory === 'systems_security') {
      return c.category.includes('Systems') || c.category.includes('Security') || c.title.includes('Networks') || c.title.includes('Cybersecurity');
    }
    if (selectedCategory === 'dev_cloud') {
      return c.category.includes('Software') || c.category.includes('Cloud') || c.title.includes('Full-Stack') || c.title.includes('DevOps');
    }
    if (selectedCategory === 'coop') {
      return c.category.includes('Cooperative') || c.category.includes('Agri') || c.category.includes('Governance');
    }
    return true;
  });

  const categoriesList = [
    { id: 'all', label: 'All Courses', count: courses.length },
    { id: 'ce_core', label: '💻 Computer Engineering (Core)', count: courses.filter(c => c.category.includes('Core') || c.title.includes('DSA') || c.title.includes('Operating') || c.title.includes('Database') || c.title.includes('Design')).length },
    { id: 'ai_ml', label: '🤖 AI & Machine Learning', count: courses.filter(c => c.category.includes('AI') || c.title.includes('Artificial') || c.title.includes('Vision')).length },
    { id: 'dev_cloud', label: '🌐 Web, Full-Stack & Cloud', count: courses.filter(c => c.category.includes('Software') || c.category.includes('Cloud') || c.title.includes('Full-Stack') || c.title.includes('DevOps')).length },
    { id: 'systems_security', label: '🔒 Systems & Cybersecurity', count: courses.filter(c => c.category.includes('Systems') || c.category.includes('Security') || c.title.includes('Networks') || c.title.includes('Cybersecurity')).length },
    { id: 'coop', label: '🏛️ Cooperative Governance', count: courses.filter(c => c.category.includes('Cooperative') || c.category.includes('Agri') || c.category.includes('Governance')).length }
  ];

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
        borderLeft: '4px solid #ef4444'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>
              Computer Engineering Curriculum & YouTube Learning Portal
            </h2>
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <YoutubeIcon size={12} /> YouTube Video Integrated
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '780px' }}>
            Accredited computer engineering modules integrated directly with high-definition YouTube video lectures. 
            Enroll in any course and tap <b>Study</b> to immediately launch the dedicated lecture video or playlist!
          </p>
        </div>

        {/* Action Header Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {currentUser.role !== 'student' ? (
            <button
              onClick={() => setShowModal(true)}
              className="gradient-btn"
              style={{ padding: '10px 18px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Create New Course
            </button>
          ) : (
            <span className="badge badge-indigo" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
              <BookOpen size={14} /> Student Curriculum (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* Enrollment & Tech Stack Sync Toast Banner */}
      {enrollToast && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.2))',
          border: '1px solid #10b981',
          borderRadius: '12px',
          color: '#f8fafc',
          fontSize: '0.88rem',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="#34d399" />
            <span>{enrollToast}</span>
          </div>
          <button
            onClick={() => setEnrollToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0 4px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'rgba(15, 23, 42, 0.4)',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categoriesList.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                background: selectedCategory === cat.id ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
                border: selectedCategory === cat.id ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: selectedCategory === cat.id ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
              }}
            >
              <span>{cat.label}</span>
              <span style={{
                background: selectedCategory === cat.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem'
              }}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '6px 14px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search popular computer engineering courses by title, topic, or professor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              padding: '6px 10px',
              fontSize: '0.85rem',
              outline: 'none',
              flex: 1
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {filteredCourses.map((course) => {
          const isEnrolled = enrolledCourses.includes(course.id);
          const isPopularCE = course.category.includes('Computer Engineering') || course.title.includes('DSA') || course.title.includes('Operating') || course.title.includes('Deep Learning');

          return (
            <div key={course.id} className="glass-card-interactive" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Thumbnail with YouTube Link Overlay */}
              <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden', background: '#0a0f1d' }}>
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'}
                  alt={course.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                />
                <span className="badge badge-indigo" style={{ position: 'absolute', top: '12px', left: '12px', backdropFilter: 'blur(8px)' }}>
                  {course.category}
                </span>

                {isPopularCE && (
                  <span className="badge badge-emerald" style={{ position: 'absolute', top: '12px', right: '12px', backdropFilter: 'blur(8px)', fontSize: '0.68rem' }}>
                    <Sparkles size={10} /> Popular CE Course
                  </span>
                )}

                {/* Direct YouTube Link Badge */}
                <a
                  href={getCourseYouTubeUrl(course)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(239, 68, 68, 0.55)',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    transition: 'all 0.2s ease',
                    zIndex: 2
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220, 38, 38, 0.95)';
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.88)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.55)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Open YouTube video lecture"
                >
                  <YoutubeIcon size={14} color="#ef4444" />
                  <span>YouTube Link</span>
                  <ExternalLink size={10} />
                </a>
              </div>

              {/* Content */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', lineHeight: 1.3, fontWeight: 600 }}>
                  {course.title}
                </h3>
                
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.5 }}>
                  {course.description}
                </p>

                {/* Trainer & Academic Meta */}
                <div style={{ fontSize: '0.78rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={14} /> Instructor: <b>{course.trainer_name}</b>
                </div>

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
                    <Users size={12} color="#38bdf8" /> {course.enrolled_count + (isEnrolled ? 1 : 0)} Students Enrolled
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

                {/* Action Buttons: View Syllabus + Enroll / Study on YouTube */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    className="gradient-btn"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => setActiveCourseModal(course)}
                  >
                    <PlayCircle size={14} /> Syllabus ({course.modules_count || 16})
                  </button>

                  {/* Enroll OR Study on YouTube Button */}
                  {isEnrolled ? (
                    <button
                      onClick={() => handleStudyCourse(course)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
                        transition: 'transform 0.15s ease'
                      }}
                      title="Tap to open YouTube video lecture"
                    >
                      <YoutubeIcon size={15} />
                      Study ▶
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnrollCourse(course.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Enroll
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ color: '#f8fafc', fontSize: '1.1rem' }}>No Courses Found</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            No courses matched your search query "{searchQuery}". Try selecting "All Courses" or searching for "DSA", "OS", or "AI".
          </p>
        </div>
      )}

      {/* Course Syllabus & YouTube Lectures Detailed Modal */}
      {activeCourseModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            background: '#0b1120',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-indigo" style={{ marginBottom: '6px' }}>
                  {activeCourseModal.category}
                </span>
                <h3 style={{ fontSize: '1.35rem', color: '#f8fafc', fontWeight: 700, margin: '4px 0' }}>
                  {activeCourseModal.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#93c5fd' }}>
                  Instructor: <b>{activeCourseModal.trainer_name}</b> • Duration: <b>{activeCourseModal.duration}</b>
                </p>
              </div>
              <button
                onClick={() => setActiveCourseModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* YouTube Study Banner in Modal */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                }}>
                  <YoutubeIcon size={26} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.96rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                    Official Video Lecture & Tutorial
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#fca5a5', margin: '2px 0 0 0' }}>
                    High-definition full course on YouTube • Stream directly on any device
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleEnrollCourse(activeCourseModal.id);
                  handleStudyCourse(activeCourseModal);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)'
                }}
              >
                <Play size={13} fill="white" />
                Study on YouTube
                <ExternalLink size={13} />
              </button>
            </div>

            {/* Course Overview Banner */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                {activeCourseModal.description}
              </p>
            </div>

            {/* Syllabus Modules Breakdown */}
            <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#818cf8" /> Curriculum Modules & Video Lectures
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {getCourseSyllabus(activeCourseModal).map((moduleItem, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.84rem', color: '#f8fafc', fontWeight: 600, margin: 0 }}>
                        {moduleItem.title}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {moduleItem.mod} • Estimated: {moduleItem.hours}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => window.open(getModuleYouTubeUrl(activeCourseModal, moduleItem.title), '_blank', 'noopener,noreferrer')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title={`Search & watch ${moduleItem.title} on YouTube`}
                    >
                      <YoutubeIcon size={13} />
                      Lecture
                    </button>

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
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveCourseModal(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f8fafc',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              {enrolledCourses.includes(activeCourseModal.id) ? (
                <button
                  type="button"
                  onClick={() => handleStudyCourse(activeCourseModal)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 20px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)'
                  }}
                >
                  <YoutubeIcon size={16} />
                  Study Now on YouTube ▶
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleEnrollCourse(activeCourseModal.id);
                    handleStudyCourse(activeCourseModal);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 20px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)'
                  }}
                >
                  <YoutubeIcon size={16} />
                  Enroll & Study on YouTube ▶
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Create Engineering Course</h3>
            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Operating Systems"
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
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#0b1120',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    marginTop: '4px',
                    outline: 'none'
                  }}
                >
                  <option value="Computer Engineering (Core)">Computer Engineering (Core)</option>
                  <option value="Computer Engineering (AI/ML)">Computer Engineering (AI/ML)</option>
                  <option value="Computer Engineering (Software Dev)">Computer Engineering (Software Dev)</option>
                  <option value="Computer Engineering (Systems)">Computer Engineering (Systems)</option>
                  <option value="Computer Engineering (Security)">Computer Engineering (Security)</option>
                  <option value="Computer Engineering (Cloud/DevOps)">Computer Engineering (Cloud/DevOps)</option>
                  <option value="Cooperative Governance">Cooperative Governance</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>YouTube Video / Playlist URL</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                    value={newYtUrl}
                    onChange={(e) => {
                      const url = e.target.value;
                      setNewYtUrl(url);
                      const autoThumb = getYouTubeThumbnail(url);
                      if (autoThumb) {
                        setNewThumbnail(autoThumb);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      marginTop: '4px'
                    }}
                  />
                  <div style={{ position: 'absolute', left: '10px', top: '14px', pointerEvents: 'none' }}>
                    <YoutubeIcon size={16} />
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Course Cover Image / Thumbnail URL</label>
                  {(newThumbnail || getYouTubeThumbnail(newYtUrl)) && (
                    <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={12} /> Image Preview Ready
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://... or automatically fetched from YouTube link above"
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
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

                {/* Live Thumbnail Preview & Quick Presets */}
                <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '90px',
                    height: '52px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    flexShrink: 0
                  }}>
                    <img
                      src={newThumbnail || getYouTubeThumbnail(newYtUrl) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500'}
                      alt="Thumbnail Preview"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Image Presets:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      <button
                        type="button"
                        onClick={() => setNewThumbnail('https://images.unsplash.com/photo-1555255707-c07966088b7b?w=600')}
                        style={{ padding: '3px 8px', fontSize: '0.68rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', cursor: 'pointer' }}
                      >
                        🤖 AI / CV
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewThumbnail('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600')}
                        style={{ padding: '3px 8px', fontSize: '0.68rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', cursor: 'pointer' }}
                      >
                        💻 Web / App
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewThumbnail('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600')}
                        style={{ padding: '3px 8px', fontSize: '0.68rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f87171', cursor: 'pointer' }}
                      >
                        🔒 Security
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewThumbnail('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600')}
                        style={{ padding: '3px 8px', fontSize: '0.68rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#34d399', cursor: 'pointer' }}
                      >
                        ☁️ Cloud
                      </button>
                    </div>
                  </div>
                </div>
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
                  placeholder="Course syllabus and engineering objectives..."
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
