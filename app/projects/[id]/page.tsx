'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectStatus, HubSpotHub } from '@/app/page'

// Website interfaces
interface Website {
  id: string
  project_id: string
  url: string
  name?: string
  description?: string
  status: 'active' | 'inactive' | 'pending_review'
  indexing_status: 'not_indexed' | 'indexing' | 'indexed' | 'failed'
  indexed_at?: string
  indexing_error?: string
  content_chunks: number
  last_crawled_at?: string
  created_date: string
  updated_at: string
}

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

const GlobeAltIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
  </svg>
)

const PlusIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const TrashIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ExternalLinkIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [websitesLoading, setWebsitesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<ProjectStage>('kickoff')
  
  // Website form state
  const [showAddWebsite, setShowAddWebsite] = useState(false)
  const [newWebsite, setNewWebsite] = useState({
    url: '',
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchProject()
    fetchWebsites()
  }, [projectId])

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

  const fetchWebsites = async () => {
    try {
      setWebsitesLoading(true)
      const response = await fetch(`/api/projects/${projectId}/websites`)
      if (!response.ok) {
        throw new Error('Failed to fetch websites')
      }
      const data = await response.json()
      setWebsites(data)
    } catch (err) {
      console.error('Error fetching websites:', err)
    } finally {
      setWebsitesLoading(false)
    }
  }

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newWebsite.url.trim()) {
      alert('Please enter a website URL')
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/websites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: newWebsite.url.trim(),
          name: newWebsite.name.trim() || null,
          description: newWebsite.description.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add website')
      }

      const website = await response.json()
      setWebsites(prev => [...prev, website])
      setNewWebsite({ url: '', name: '', description: '' })
      setShowAddWebsite(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add website')
    }
  }

  const handleDeleteWebsite = async (websiteId: string) => {
    if (!confirm('Are you sure you want to delete this website?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/websites/${websiteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete website')
      }

      setWebsites(prev => prev.filter(w => w.id !== websiteId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete website')
    }
  }

  const handleIndexWebsite = async (websiteId: string) => {
    try {
      // TODO: Implement indexing logic
      // For now, just show a placeholder alert
      alert('Website indexing will be implemented in the next phase.')
    } catch (err) {
      console.error('Error indexing website:', err)
      alert('Failed to index website. Please try again.')
    }
  }

  const handleReindexWebsite = async (websiteId: string) => {
    try {
      // TODO: Implement re-indexing logic
      // For now, just show a placeholder alert
      alert('Website re-indexing will be implemented in the next phase.')
    } catch (err) {
      console.error('Error re-indexing website:', err)
      alert('Failed to re-index website. Please try again.')
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

  if (loading) {
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

        {/* Customer Websites Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="h-6 w-6 text-valve-blue" />
              <h2 className="text-xl font-semibold text-valve-text">Customer Websites</h2>
            </div>
            <button
              onClick={() => setShowAddWebsite(!showAddWebsite)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Website</span>
            </button>
          </div>

          {/* Add Website Form */}
          {showAddWebsite && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <form onSubmit={handleAddWebsite} className="space-y-4">
                <div>
                  <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL *
                  </label>
                  <input
                    id="website-url"
                    type="url"
                    placeholder="https://example.com"
                    value={newWebsite.url}
                    onChange={(e) => setNewWebsite(prev => ({ ...prev, url: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="website-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Website Name
                    </label>
                    <input
                      id="website-name"
                      type="text"
                      placeholder="Main website"
                      value={newWebsite.name}
                      onChange={(e) => setNewWebsite(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="website-description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      id="website-description"
                      type="text"
                      placeholder="Brief description"
                      value={newWebsite.description}
                      onChange={(e) => setNewWebsite(prev => ({ ...prev, description: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary">
                    Add Website
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddWebsite(false)
                      setNewWebsite({ url: '', name: '', description: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Websites List */}
          {websitesLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading websites...</p>
            </div>
          ) : websites.length === 0 ? (
            <div className="text-center py-8">
              <GlobeAltIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No websites added yet</p>
              <p className="text-sm text-gray-400">Add customer websites to track for this project</p>
            </div>
          ) : (
            <div className="space-y-4">
              {websites.map((website) => (
                <div key={website.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <a
                          href={website.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-valve-blue hover:text-valve-accent font-medium flex items-center space-x-2"
                        >
                          <span>{website.name || website.url}</span>
                          <ExternalLinkIcon className="h-4 w-4" />
                        </a>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          website.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : website.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {website.status.replace('_', ' ')}
                        </span>
                      </div>
                      {website.name && (
                        <p className="text-sm text-gray-600 mb-1">{website.url}</p>
                      )}
                      {website.description && (
                        <p className="text-sm text-gray-500">{website.description}</p>
                      )}
                      
                      {/* Indexing Status */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            website.indexing_status === 'indexed' 
                              ? 'bg-green-100 text-green-800'
                              : website.indexing_status === 'indexing'
                              ? 'bg-blue-100 text-blue-800'
                              : website.indexing_status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {website.indexing_status === 'not_indexed' && 'Not Indexed'}
                            {website.indexing_status === 'indexing' && 'Indexing...'}
                            {website.indexing_status === 'indexed' && 'Indexed'}
                            {website.indexing_status === 'failed' && 'Index Failed'}
                          </span>
                          
                          {website.indexing_status === 'indexed' && website.indexed_at && (
                            <span className="text-xs text-gray-500">
                              Indexed {formatDate(website.indexed_at)}
                            </span>
                          )}
                          
                          {website.indexing_status === 'indexed' && website.content_chunks > 0 && (
                            <span className="text-xs text-gray-500">
                              {website.content_chunks} chunks
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {website.indexing_status === 'not_indexed' && (
                            <button
                              onClick={() => handleIndexWebsite(website.id)}
                              className="inline-flex items-center px-3 py-1 border border-valve-blue text-valve-blue rounded-md text-sm hover:bg-valve-blue hover:text-white transition-colors"
                            >
                              Index Website
                            </button>
                          )}
                          
                          {website.indexing_status === 'indexed' && (
                            <button
                              onClick={() => handleReindexWebsite(website.id)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 transition-colors"
                            >
                              Re-index
                            </button>
                          )}
                          
                          {website.indexing_status === 'failed' && (
                            <button
                              onClick={() => handleIndexWebsite(website.id)}
                              className="inline-flex items-center px-3 py-1 border border-red-600 text-red-600 rounded-md text-sm hover:bg-red-600 hover:text-white transition-colors"
                            >
                              Retry Index
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-2">
                        Added {formatDate(website.created_date)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteWebsite(website.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors ml-4"
                      title="Delete website"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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