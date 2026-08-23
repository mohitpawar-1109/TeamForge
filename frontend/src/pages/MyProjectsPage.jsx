import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, PlusCircle, Sparkles, Users } from 'lucide-react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProjectCard } from '../components/cards/ProjectCard';
import { Button } from '../components/common/Button';
import { CardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F6E8E2] tracking-tight">My Projects</h1>
          <p className="text-xs sm:text-sm text-[#DDA081] mt-1">
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
      <div className="flex items-center gap-4 border-b border-[#703344]">
        <button
          onClick={() => setTab('created')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            tab === 'created'
              ? 'border-[#A84A4D] text-[#F6E8E2]'
              : 'border-transparent text-[#DDA081] hover:text-[#F6E8E2]'
          }`}
        >
          Created by You ({createdProjects.length})
        </button>
        <button
          onClick={() => setTab('joined')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            tab === 'joined'
              ? 'border-[#A84A4D] text-[#F6E8E2]'
              : 'border-transparent text-[#DDA081] hover:text-[#F6E8E2]'
          }`}
        >
          Teams Joined ({joinedProjects.length})
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : tab === 'created' ? (
        createdProjects.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title="No projects created yet"
            description="Start by publishing your hackathon or engineering project idea to assemble your dream team."
            actionLabel="Create First Project"
            actionLink="/projects/create"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdProjects.map(p => (
              <ProjectCard key={p._id} project={p} showMatchScore={false} />
            ))}
          </div>
        )
      ) : (
        joinedProjects.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No teams joined yet"
            description="Explore recruiting projects across university tracks or respond to incoming team invitations."
            actionLabel="Explore Projects"
            actionLink="/projects"
          />
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
