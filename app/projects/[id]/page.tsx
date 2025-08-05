'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectStatus, HubSpotHub } from '@/app/page'

// SVG Icons
const ArrowLeftIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const CalendarIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
  </svg>
)

const UserIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const BuildingOfficeIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

interface Project {
  id: string
  name: string
  customer: string
  created_date: string
  project_start_date: string | null
  project_owner: string
  hubspot_hubs: HubSpotHub[]
  status: ProjectStatus
  description: string | null
  updated_at: string
}

type ProjectStage = 'kickoff' | 'workshop1' | 'workshop2' | 'implementation' | 'closing'

const PROJECT_STAGES: { id: ProjectStage; name: string; description: string }[] = [
  {
    id: 'kickoff',
    name: 'Kickoff',
    description: 'Initial project setup and planning'
  },
  {
    id: 'workshop1',
    name: 'Workshop 1',
    description: 'First workshop session with the client'
  },
  {
    id: 'workshop2',
    name: 'Workshop 2',
    description: 'Second workshop session and refinements'
  },
  {
    id: 'implementation',
    name: 'Implementation',
    description: 'Technical implementation and development'
  },
  {
    id: 'closing',
    name: 'Closing',
    description: 'Project completion and handover'
  }
]

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const projectId = resolvedParams.id
  
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<ProjectStage>('kickoff')
  const [isClient, setIsClient] = useState(false)

  // Set client flag after hydration to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchProject()
    }
  }, [projectId, isClient])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }
      const data = await response.json()
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatHubName = (hub: HubSpotHub) => {
    const hubNames: Record<HubSpotHub, string> = {
      'marketing_hub': 'Marketing Hub',
      'sales_hub': 'Sales Hub',
      'service_hub': 'Service Hub',
      'operations_hub': 'Operations Hub',
      'hubspot_crm': 'HubSpot CRM',
      'commerce_hub': 'Commerce Hub',
      'content_hub': 'Content Hub'
    }
    return hubNames[hub] || hub.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'on_hold':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-valve-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-valve-text">Loading project...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-valve-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              {error || 'Project not found'}
            </div>
            <button
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-valve-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-valve-blue hover:text-valve-accent transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Projects</span>
          </button>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-valve-text">{project.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.replace('_', ' ').slice(1)}
                </span>
              </div>

              {project.description && (
                <p className="text-gray-600 mb-6 text-lg">{project.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium text-valve-text">{project.customer}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Project Owner</p>
                    <p className="font-medium text-valve-text">{project.project_owner}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-valve-text">{formatDate(project.created_date)}</p>
                  </div>
                </div>

                {project.project_start_date && (
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium text-valve-text">{formatDate(project.project_start_date)}</p>
                    </div>
                  </div>
                )}
              </div>

              {Array.isArray(project.hubspot_hubs) && project.hubspot_hubs.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-3">HubSpot Hubs</p>
                  <div className="flex flex-wrap gap-2">
                    {project.hubspot_hubs.map((hub) => (
                      <span 
                        key={hub}
                        className="px-3 py-1 bg-valve-blue bg-opacity-10 text-valve-blue text-sm rounded-md font-medium"
                      >
                        {formatHubName(hub)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Stages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-valve-text mb-6">Project Stages</h2>
          
          {/* Stage Tabs */}
          <div className="flex flex-wrap border-b border-gray-200 mb-6">
            {PROJECT_STAGES.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors mr-8 ${
                  activeStage === stage.id
                    ? 'border-valve-blue text-valve-blue'
                    : 'border-transparent text-gray-500 hover:text-valve-text hover:border-gray-300'
                }`}
              >
                {stage.name}
              </button>
            ))}
          </div>

          {/* Stage Content */}
          <div className="py-6">
            {PROJECT_STAGES.map((stage) => (
              <div key={stage.id} className={activeStage === stage.id ? 'block' : 'hidden'}>
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-valve-text mb-2">{stage.name}</h3>
                  <p className="text-gray-600 mb-4">{stage.description}</p>
                  <p className="text-sm text-gray-500">Content for this stage will be implemented here.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 