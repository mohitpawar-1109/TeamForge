import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, PlusCircle, Sparkles } from 'lucide-react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProjectCard } from '../components/cards/ProjectCard';
import { Button } from '../components/common/Button';

export const MyProjectsPage = () => {
  const { user } = useAuth();
  const [createdProjects, setCreatedProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('created');

  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        setLoading(true);
        const [createdRes, memberRes] = await Promise.all([
          projectAPI.getProjects({ owner: user?._id }),
          projectAPI.getProjects({ member: user?._id })
        ]);

        if (createdRes.data.success) {
          setCreatedProjects(createdRes.data.data);
        }
        if (memberRes.data.success) {
          // Joined are projects where user is member but not owner
          const joined = memberRes.data.data.filter(p => p.owner?._id !== user?._id && p.owner !== user?._id);
          setJoinedProjects(joined);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyProjects();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Projects</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage projects you created and collaborative teams you have joined.
          </p>
        </div>

        <Link to="/projects/create">
          <Button variant="primary" size="md" icon={PlusCircle}>
            Create New Project
          </Button>
        </Link>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setTab('created')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${
            tab === 'created'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Created by You ({createdProjects.length})
        </button>
        <button
          onClick={() => setTab('joined')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${
            tab === 'joined'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Teams Joined ({joinedProjects.length})
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : tab === 'created' ? (
        createdProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No projects created yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Start by publishing your hackathon or capstone project idea.</p>
            <Link to="/projects/create">
              <Button variant="primary" size="sm" icon={PlusCircle}>
                Create First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdProjects.map(p => (
              <ProjectCard key={p._id} project={p} showMatchScore={false} />
            ))}
          </div>
        )
      ) : (
        joinedProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <h3 className="font-bold text-slate-800 text-base">No teams joined yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Explore recruiting projects or respond to incoming invitations.</p>
            <Link to="/projects">
              <Button variant="outline" size="sm">Explore Projects</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedProjects.map(p => (
              <ProjectCard key={p._id} project={p} showMatchScore={false} />
            ))}
          </div>
        )
      )}
    </div>
  );
};
