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
  crawl_status: 'pending' | 'crawling' | 'completed' | 'failed' | 'paused'
  total_pages_discovered: number
  pages_crawled: number
  pages_failed: number
  max_pages: number
  max_depth: number
  started_at?: string
  completed_at?: string
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

const SparklesIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const ExternalLinkIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const CheckCircleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const EyeIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const ChevronDownIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
)

const ChevronUpIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
)

const DocumentTextIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const XMarkIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
  const [crawlingWebsites, setCrawlingWebsites] = useState<Set<string>>(new Set())
  const [pollIntervals, setPollIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map())
  const [isClient, setIsClient] = useState(false)
  const [crawlProgress, setCrawlProgress] = useState<Map<string, {
    status: string
    currentAction: string
    discoveredPages: Array<{
      url: string
      title?: string
      status: 'discovered' | 'crawling' | 'saved' | 'failed'
      timestamp: string
      depth?: number
      wordCount?: number
    }>
    totalPages: number
    processedPages: number
    startTime: string
  }>>(new Map())
  const [showProgressModal, setShowProgressModal] = useState<string | null>(null)
  const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set())
  const [websitePages, setWebsitePages] = useState<Map<string, Array<{
    id: string
    url: string
    title?: string
    content?: string
    depth: number
    wordCount: number
    linkCount: number
    status: string
    discoveredAt: string
    scrapedAt?: string
  }>>>(new Map())
  
  // Content modal state
  const [showContentModal, setShowContentModal] = useState<{
    pageId: string
    pageTitle: string
    pageUrl: string
    content: string
  } | null>(null)
  
  // Website form state
  const [showAddWebsite, setShowAddWebsite] = useState(false)
  const [newWebsite, setNewWebsite] = useState({
    url: '',
    name: '',
    description: ''
  })

  // Set client flag after hydration to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchProject()
      fetchWebsites()
    }
  }, [projectId, isClient])

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollIntervals.forEach(interval => clearInterval(interval))
    }
  }, [pollIntervals])

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

  const pollCrawlProgress = async (websiteId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/websites/${websiteId}/crawl`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Update the specific website in the list
          setWebsites(prev => prev.map(w => {
            if (w.id === websiteId) {
              return {
                ...w,
                crawl_status: result.data.crawl_status,
                total_pages_discovered: result.data.total_pages_discovered,
                pages_crawled: result.data.pages_crawled,
                pages_failed: result.data.pages_failed,
                started_at: result.data.started_at,
                completed_at: result.data.completed_at
              }
            }
            return w
          }))

          // Stop polling if crawl is complete
          if (result.data.crawl_status === 'completed' || result.data.crawl_status === 'failed') {
            stopPolling(websiteId)
            setCrawlingWebsites(prev => {
              const newSet = new Set(prev)
              newSet.delete(websiteId)
              return newSet
            })
            
            // Keep progress modal open for user to review results
            // Progress state is preserved so user can see what was crawled
          }
        }
      }
    } catch (err) {
      console.error('Error polling crawl progress:', err)
    }
  }

  const startPolling = (websiteId: string) => {
    // Clear existing interval if any
    stopPolling(websiteId)
    
    // Start new polling interval
    const interval = setInterval(() => {
      pollCrawlProgress(websiteId)
    }, 2000) // Poll every 2 seconds
    
    setPollIntervals(prev => new Map(prev).set(websiteId, interval))
  }

  const stopPolling = (websiteId: string) => {
    const interval = pollIntervals.get(websiteId)
    if (interval) {
      clearInterval(interval)
      setPollIntervals(prev => {
        const newMap = new Map(prev)
        newMap.delete(websiteId)
        return newMap
      })
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

  const handleToggleWebsiteExpansion = async (websiteId: string) => {
    const isCurrentlyExpanded = expandedWebsites.has(websiteId)
    
    if (isCurrentlyExpanded) {
      // Collapse
      setExpandedWebsites(prev => {
        const newSet = new Set(prev)
        newSet.delete(websiteId)
        return newSet
      })
    } else {
      // Expand and load pages if not already loaded
      setExpandedWebsites(prev => new Set(prev).add(websiteId))
      
      if (!websitePages.has(websiteId)) {
        try {
          const response = await fetch(`/api/projects/${projectId}/websites/${websiteId}/pages`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data.pages) {
              setWebsitePages(prev => new Map(prev).set(websiteId, result.data.pages))
            }
          }
        } catch (error) {
          console.error('Error loading website pages:', error)
        }
      }
    }
  }

  const handleCrawlWebsite = async (websiteId: string, websiteUrl: string) => {
    if (!confirm('Start crawling this website? This will discover and process up to 10 pages at depth 2.')) {
      return
    }

    // Initialize progress tracking
    setCrawlProgress(prev => new Map(prev).set(websiteId, {
      status: 'initializing',
      currentAction: 'Starting crawl process...',
      discoveredPages: [],
      totalPages: 0,
      processedPages: 0,
      startTime: new Date().toISOString()
    }))

    setCrawlingWebsites(prev => new Set(prev).add(websiteId))
    setShowProgressModal(websiteId)

    try {
      // Update progress - starting discovery
      setCrawlProgress(prev => {
        const current = prev.get(websiteId)
        if (current) {
          return new Map(prev).set(websiteId, {
            ...current,
            status: 'discovering',
            currentAction: 'Discovering pages...'
          })
        }
        return prev
      })

      // Start the crawling process
      const response = await fetch(`/api/projects/${projectId}/websites/${websiteId}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: websiteUrl,
          maxPages: 10,
          maxDepth: 2
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start crawling')
      }

      const result = await response.json()
      
      if (result.success) {
        // Update progress with results
        if (result.data?.crawlData?.pages) {
          const pages = result.data.crawlData.pages.map((page: any, index: number) => ({
            url: page.url,
            title: page.title,
            status: 'saved' as const,
            timestamp: new Date().toISOString(),
            depth: page.depth,
            wordCount: page.wordCount
          }))

          setCrawlProgress(prev => {
            const current = prev.get(websiteId)
            if (current) {
              return new Map(prev).set(websiteId, {
                ...current,
                status: 'completed',
                currentAction: 'Crawl completed successfully!',
                discoveredPages: pages,
                totalPages: pages.length,
                processedPages: pages.length
              })
            }
            return prev
          })
        }
        
        // Start polling for progress updates
        startPolling(websiteId)
        
        // Final refresh to ensure we have the latest data
        await fetchWebsites()
        
        // Clear any cached pages so they'll be reloaded if user expands
        setWebsitePages(prev => {
          const newMap = new Map(prev)
          newMap.delete(websiteId)
          return newMap
        })
      } else {
        throw new Error(result.error || 'Crawling failed')
      }
      
    } catch (err) {
      console.error('Crawling error:', err)
      
      // Update progress with error
      setCrawlProgress(prev => {
        const current = prev.get(websiteId)
        if (current) {
          return new Map(prev).set(websiteId, {
            ...current,
            status: 'failed',
            currentAction: `Error: ${err instanceof Error ? err.message : 'Failed to start crawling'}`
          })
        }
        return prev
      })
      
      // Stop polling and remove from crawling set on error
      stopPolling(websiteId)
      setCrawlingWebsites(prev => {
        const newSet = new Set(prev)
        newSet.delete(websiteId)
        return newSet
      })
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

        {/* Crawl Progress Modal */}
        {showProgressModal && isClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {(() => {
                const progress = crawlProgress.get(showProgressModal)
                if (!progress) return null
                
                return (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-valve-text">Website Crawling Progress</h2>
                        <p className="text-gray-600 text-sm mt-1">
                          Started: {formatDate(progress.startTime)}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowProgressModal(null)}
                        className="text-gray-500 hover:text-gray-700 p-2"
                        title="Close"
                      >
                        <XCircleIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Current Status */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {progress.status === 'completed' ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-500" />
                        ) : progress.status === 'failed' ? (
                          <XCircleIcon className="h-6 w-6 text-red-500" />
                        ) : (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-valve-blue"></div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 capitalize">{progress.status}</div>
                          <div className="text-sm text-gray-600">{progress.currentAction}</div>
                        </div>
                      </div>
                      
                      {/* Progress Stats */}
                      {progress.totalPages > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-valve-blue">{progress.totalPages}</div>
                            <div className="text-xs text-gray-500">Discovered</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">{progress.processedPages}</div>
                            <div className="text-xs text-gray-500">Processed</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-600">
                              {progress.totalPages > 0 ? Math.round((progress.processedPages / progress.totalPages) * 100) : 0}%
                            </div>
                            <div className="text-xs text-gray-500">Complete</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pages List */}
                    {progress.discoveredPages.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Discovered Pages ({progress.discoveredPages.length})</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {progress.discoveredPages.map((page, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {page.status === 'saved' ? (
                                      <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    ) : page.status === 'failed' ? (
                                      <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    ) : page.status === 'crawling' ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 flex-shrink-0"></div>
                                    ) : (
                                      <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      page.status === 'saved' 
                                        ? 'bg-green-100 text-green-800'
                                        : page.status === 'failed'
                                        ? 'bg-red-100 text-red-800'
                                        : page.status === 'crawling'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {page.status}
                                    </span>
                                    {page.depth !== undefined && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        Depth {page.depth}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="mb-2">
                                    <a 
                                      href={page.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-valve-blue hover:text-valve-accent font-medium text-sm break-all"
                                    >
                                      {page.url}
                                    </a>
                                  </div>
                                  
                                  {page.title && (
                                    <div className="text-sm text-gray-700 mb-2 font-medium">
                                      {page.title}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>Added: {new Date(page.timestamp).toLocaleTimeString()}</span>
                                    {page.wordCount && (
                                      <span>{page.wordCount.toLocaleString()} words</span>
                                    )}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => window.open(page.url, '_blank')}
                                  className="ml-3 p-1 text-gray-400 hover:text-valve-blue"
                                  title="Open page"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {progress.discoveredPages.length === 0 && progress.status !== 'failed' && (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-valve-blue mx-auto mb-4"></div>
                        <p className="text-gray-600">Discovering pages...</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end space-x-3">
                      {progress.status === 'completed' && (
                        <button
                          onClick={() => {
                            setShowProgressModal(null)
                            setCrawlProgress(prev => {
                              const newMap = new Map(prev)
                              newMap.delete(showProgressModal)
                              return newMap
                            })
                          }}
                          className="btn-primary"
                        >
                          Done
                        </button>
                      )}
                      
                      {progress.status === 'failed' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setShowProgressModal(null)}
                            className="btn-secondary"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => {
                              setShowProgressModal(null)
                              const websiteToRetry = websites.find(w => w.id === showProgressModal)
                              if (websiteToRetry) {
                                handleCrawlWebsite(websiteToRetry.id, websiteToRetry.url)
                              }
                            }}
                            className="btn-primary"
                          >
                            Retry Crawl
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

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
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            website.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : website.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {website.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isClient && website.crawl_status === 'completed' 
                              ? 'bg-blue-100 text-blue-800' 
                              : isClient && website.crawl_status === 'crawling'
                              ? 'bg-orange-100 text-orange-800'
                              : isClient && website.crawl_status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isClient ? (website.crawl_status === 'pending' ? 'not crawled' : website.crawl_status) : 'loading...'}
                          </span>
                        </div>
                      </div>
                      {website.name && (
                        <p className="text-sm text-gray-600 mb-1">{website.url}</p>
                      )}
                      {website.description && (
                        <p className="text-sm text-gray-500 mb-3">{website.description}</p>
                      )}


                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          Added {formatDate(website.created_date)}
                        </p>
                        <div className="flex items-center space-x-2">
                          {isClient ? (
                            <>
                              <button
                                onClick={() => handleCrawlWebsite(website.id, website.url)}
                                disabled={
                                  crawlingWebsites.has(website.id) || 
                                  website.crawl_status === 'crawling'
                                }
                                className={`flex items-center space-x-1 px-3 py-1 text-xs rounded transition-colors ${
                                  website.crawl_status === 'completed'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : website.crawl_status === 'failed'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : website.crawl_status === 'crawling' || crawlingWebsites.has(website.id)
                                    ? 'bg-orange-500 text-white cursor-not-allowed opacity-75'
                                    : 'bg-valve-blue text-white hover:bg-valve-accent'
                                }`}
                                title={
                                  website.crawl_status === 'completed' 
                                    ? 'Re-crawl website pages'
                                    : website.crawl_status === 'failed'
                                    ? 'Retry crawling website'
                                    : website.crawl_status === 'crawling'
                                    ? 'Crawling in progress...'
                                    : 'Crawl website pages'
                                }
                              >
                                <SparklesIcon className="h-3 w-3" />
                                <span>
                                  {website.crawl_status === 'completed' 
                                    ? 'Re-crawl'
                                    : website.crawl_status === 'failed'
                                    ? 'Retry'
                                    : website.crawl_status === 'crawling' || crawlingWebsites.has(website.id)
                                    ? 'Crawling...'
                                    : 'Crawl'
                                  }
                                </span>
                              </button>
                              
                              {/* Show expand/collapse button for completed crawls with pages */}
                              {website.crawl_status === 'completed' && website.pages_crawled > 0 && (
                                <button
                                  onClick={() => handleToggleWebsiteExpansion(website.id)}
                                  className="flex items-center space-x-1 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                  title={expandedWebsites.has(website.id) ? "Hide crawled pages" : "Show crawled pages"}
                                >
                                  {expandedWebsites.has(website.id) ? (
                                    <>
                                      <ChevronUpIcon className="h-3 w-3" />
                                      <span>Hide Pages ({website.pages_crawled})</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDownIcon className="h-3 w-3" />
                                      <span>Show Pages ({website.pages_crawled})</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              disabled
                              className="flex items-center space-x-1 px-3 py-1 text-xs rounded bg-gray-300 text-gray-500 cursor-not-allowed"
                            >
                              <SparklesIcon className="h-3 w-3" />
                              <span>Crawl</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteWebsite(website.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete website"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Pages Section */}
                      {isClient && expandedWebsites.has(website.id) && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              Crawled Pages ({websitePages.get(website.id)?.length || website.pages_crawled || 0})
                            </h4>
                            {!websitePages.has(website.id) && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-valve-blue"></div>
                            )}
                          </div>
                          
                          {websitePages.has(website.id) ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {websitePages.get(website.id)?.map((page, index) => (
                                <div key={page.id} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                          Crawled
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                          Depth {page.depth}
                                        </span>
                                      </div>
                                      
                                      <a 
                                        href={page.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-valve-blue hover:text-valve-accent font-medium text-sm break-all mb-1 block"
                                      >
                                        {page.url}
                                      </a>
                                      
                                      {page.title && (
                                        <div className="text-sm text-gray-700 mb-2 font-medium">
                                          {page.title}
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span>
                                          Crawled: {new Date(page.scrapedAt || page.discoveredAt).toLocaleDateString()}
                                        </span>
                                        {page.wordCount > 0 && (
                                          <span>{page.wordCount.toLocaleString()} words</span>
                                        )}
                                        {page.linkCount > 0 && (
                                          <span>{page.linkCount} links</span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex space-x-1 ml-3">
                                      <button
                                        onClick={() => setShowContentModal({
                                          pageId: page.id,
                                          pageTitle: page.title || 'Untitled Page',
                                          pageUrl: page.url,
                                          content: page.content || 'No content available'
                                        })}
                                        className="p-1 text-gray-400 hover:text-valve-blue"
                                        title="See content"
                                      >
                                        <DocumentTextIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => window.open(page.url, '_blank')}
                                        className="p-1 text-gray-400 hover:text-valve-blue"
                                        title="Open page"
                                      >
                                        <ExternalLinkIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-valve-blue mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">Loading pages...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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

      {/* Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {showContentModal.pageTitle}
                </h3>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {showContentModal.pageUrl}
                </p>
              </div>
              <button
                onClick={() => setShowContentModal(null)}
                className="ml-3 p-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                {showContentModal.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowContentModal(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 