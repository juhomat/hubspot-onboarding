'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// SVG Icons
const PlusIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const FolderIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
  </svg>
)

const CalendarIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const UserIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

// Types matching our database schema
export type ProjectStatus = 'pending' | 'active' | 'completed' | 'on_hold' | 'cancelled';

export type HubSpotHub = 
  | 'marketing_hub' 
  | 'sales_hub' 
  | 'service_hub' 
  | 'operations_hub'
  | 'hubspot_crm'
  | 'commerce_hub' 
  | 'content_hub';

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

interface CreateProjectRequest {
  name: string
  customer: string
  project_start_date?: string
  project_owner: string
  hubspot_hubs?: HubSpotHub[]
  description?: string
}

export default function HomePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    customer: '',
    project_owner: '',
    project_start_date: '',
    hubspot_hubs: [] as HubSpotHub[],
    description: ''
  })

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/projects')
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setProjects(result.data)
      } else {
        throw new Error(result.error || 'Failed to load projects')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProject.name || !newProject.customer || !newProject.project_owner) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      const projectData: CreateProjectRequest = {
        name: newProject.name,
        customer: newProject.customer,
        project_owner: newProject.project_owner,
        project_start_date: newProject.project_start_date || undefined,
        hubspot_hubs: newProject.hubspot_hubs.length > 0 ? newProject.hubspot_hubs : undefined,
        description: newProject.description || undefined
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const result = await response.json()
      
      if (result.success) {
        // Add new project to the list
        setProjects([result.data, ...projects])
        // Reset form
        setNewProject({
          name: '',
          customer: '',
          project_owner: '',
          project_start_date: '',
          hubspot_hubs: [],
          description: ''
        })
        setShowAddForm(false)
      } else {
        throw new Error(result.error || 'Failed to create project')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      console.error('Error creating project:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-orange-100 text-orange-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const availableHubs: HubSpotHub[] = [
    'hubspot_crm',
    'marketing_hub',
    'sales_hub', 
    'service_hub',
    'operations_hub',
    'commerce_hub',
    'content_hub'
  ]

  const toggleHub = (hub: HubSpotHub) => {
    setNewProject(prev => ({
      ...prev,
      hubspot_hubs: prev.hubspot_hubs.includes(hub)
        ? prev.hubspot_hubs.filter(h => h !== hub)
        : [...prev.hubspot_hubs, hub]
    }))
  }

  return (
    <div className="min-h-screen bg-valve-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-valve-text mb-4">
            HubSpot Onboarding Projects
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Manage and track HubSpot onboarding projects for your B2B clients. 
            Streamline your implementation process with our comprehensive project management system.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Project Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center space-x-2"
            disabled={loading}
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add New Project</span>
          </button>
        </div>

        {/* Add Project Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-valve-text mb-6">Add New Project</h2>
              <form onSubmit={handleAddProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Client HubSpot Implementation"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer *
                    </label>
                    <input
                      type="text"
                      value={newProject.customer}
                      onChange={(e) => setNewProject({ ...newProject, customer: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Nokia"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Owner *
                    </label>
                    <input
                      type="text"
                      value={newProject.project_owner}
                      onChange={(e) => setNewProject({ ...newProject, project_owner: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Sarah Johnson"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Start Date
                    </label>
                    <input
                      type="date"
                      value={newProject.project_start_date}
                      onChange={(e) => setNewProject({ ...newProject, project_start_date: e.target.value })}
                      className="input-field"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HubSpot Hubs
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableHubs.map((hub) => (
                      <label key={hub} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newProject.hubspot_hubs.includes(hub)}
                          onChange={() => toggleHub(hub)}
                          className="rounded border-gray-300 text-valve-blue focus:ring-valve-blue"
                          disabled={submitting}
                        />
                        <span className="text-sm text-gray-700">{formatHubName(hub)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Brief description of the project scope..."
                    disabled={submitting}
                  />
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Project'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setError(null)
                    }}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-valve-blue"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FolderIcon className="h-6 w-6 text-valve-blue" />
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-valve-text mb-2">
                  {project.name}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{project.customer}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Created {formatDate(project.created_date)}
                    </span>
                  </div>

                  {project.project_start_date && (
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Starts {formatDate(project.project_start_date)}
                      </span>
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Owner:</span> {project.project_owner}
                  </div>

                  {Array.isArray(project.hubspot_hubs) && project.hubspot_hubs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.hubspot_hubs.map((hub) => (
                        <span 
                          key={hub}
                          className="px-2 py-1 bg-valve-blue bg-opacity-10 text-valve-blue text-xs rounded-md"
                        >
                          {formatHubName(hub)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {project.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {project.description}
                  </p>
                )}
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    View Details
                  </button>
                  <button className="btn-secondary text-sm py-2 px-4">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first HubSpot onboarding project.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 