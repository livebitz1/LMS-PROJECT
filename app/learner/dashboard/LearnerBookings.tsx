"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Calendar,
  Clock,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
} from "lucide-react"

export type LearnerBooking = {
  id: string
  teacherId: string
  teacherName: string
  teacherProfileImageUrl?: string | null
  createdAt: string
  message?: string | null
}

type ParsedMessage = {
  text: string
  timeRequested: string | null
  status: "PENDING" | "ACCEPTED" | "REJECTED"
}

const parseMessage = (msg?: string | null): ParsedMessage => {
  if (!msg) return { text: "", timeRequested: null, status: "PENDING" }
  try {
    const parsed = JSON.parse(msg)
    return {
      text: parsed.text || "",
      timeRequested: parsed.timeRequested || null,
      status: (parsed.status || "PENDING").toUpperCase() as ParsedMessage["status"],
    }
  } catch {
    return { text: msg, timeRequested: null, status: "PENDING" }
  }
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function LearnerBookings({ bookings: initialBookings }: { bookings: LearnerBooking[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<LearnerBooking[]>(initialBookings ?? [])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)

  const refreshBookings = async () => {
    try {
      setIsRefreshing(true)
      const res = await fetch("/api/learner/bookings", { credentials: "same-origin" })
      if (!res.ok) throw new Error("Failed to fetch bookings")
      const data = await res.json()
      setBookings(data.bookings ?? [])
      toast({ title: "Success", description: "Bookings updated successfully." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelId || isCanceling) return
    setIsCanceling(true)

    try {
      const res = await fetch("/api/learner/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: cancelId }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || "Failed to cancel")
      }

      setBookings((prev) => prev.filter((b) => b.id !== cancelId))
      toast({
        title: "Booking Canceled",
        description: "Your session has been removed.",
      })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: (e as Error).message || "Please try again.",
      })
    } finally {
      setIsCanceling(false)
      setCancelId(null)
    }
  }

  const openCancelDialog = (id: string) => setCancelId(id)

  const displayed = bookings.filter((b) => {
    const msg = parseMessage(b.message)
    const matchesSearch =
      search.trim() === "" || `${b.teacherName} ${msg.text}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || msg.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusConfig = {
    PENDING: {
      color: "bg-amber-50 text-amber-900 border-amber-200",
      badgeColor: "bg-amber-100 text-amber-700",
      icon: AlertCircle,
      label: "Pending",
    },
    ACCEPTED: {
      color: "bg-emerald-50 text-emerald-900 border-emerald-200",
      badgeColor: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
      label: "Confirmed",
    },
    REJECTED: {
      color: "bg-red-50 text-red-900 border-red-200",
      badgeColor: "bg-red-100 text-red-700",
      icon: XCircle,
      label: "Rejected",
    },
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col gap-4">
              {/* Header title section */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Booked Teachers</h1>
                  <p className="text-sm text-slate-600 mt-1 hidden sm:block">Manage your learning sessions</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-emerald-600">{bookings.length}</div>
                    <div className="text-xs text-slate-500">Booking{bookings.length !== 1 ? "s" : ""}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshBookings}
                    disabled={isRefreshing}
                    className="gap-1.5 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors p-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search teacher..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-transparent rounded-lg focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:border-emerald-800 transition-all bg-white placeholder-slate-400"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                </div>

                <div className="relative min-w-fit">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as "ALL" | "PENDING" | "ACCEPTED" | "REJECTED")}
                    className="pl-8 pr-8 py-2.5 text-sm border-2 border-transparent rounded-lg appearance-none bg-white focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:border-emerald-800 transition-all cursor-pointer font-medium text-slate-700"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  >
                    <option value="ALL">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Confirmed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {bookings.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="bg-emerald-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">No Bookings Yet</h3>
              <p className="text-sm text-slate-600">Start exploring teachers to book your first session.</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">No bookings match your search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((b) => {
                const msg = parseMessage(b.message)
                const statusData = statusConfig[msg.status]
                const StatusIcon = statusData.icon

                return (
                  <Card
                    key={b.id}
                    className="overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 transition-colors"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-emerald-100">
                            <AvatarImage src={b.teacherProfileImageUrl || undefined} alt={b.teacherName} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold">
                              {b.teacherName?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900 text-base sm:text-lg truncate">
                                {b.teacherName}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Booked{" "}
                                  {new Date(b.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold flex-shrink-0 ${statusData.badgeColor}`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{statusData.label}</span>
                            </div>
                          </div>

                          {/* Message section */}
                          {msg.text && (
                            <div className="mb-3">
                              <p className="text-sm text-slate-700 line-clamp-2">{msg.text}</p>
                            </div>
                          )}

                          {/* Time and actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            {msg.timeRequested && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                                <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">{formatDate(msg.timeRequested)}</span>
                              </div>
                            )}

                            <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => b.teacherId && router.push(`/teacher/${b.teacherId}`)}
                                disabled={!b.teacherId}
                                className="flex-1 sm:flex-none text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                Profile
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openCancelDialog(b.id)}
                                disabled={isCanceling}
                                className="flex-1 sm:flex-none text-xs bg-red-600 hover:bg-red-700"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Cancel Booking?</DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-2">
              Remove your booking with{" "}
              <span className="font-semibold text-slate-900">
                {bookings.find((b) => b.id === cancelId)?.teacherName}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Separator className="my-4 bg-slate-200/50" />
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCancelId(null)}
              disabled={isCanceling}
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCanceling}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isCanceling ? "Canceling..." : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
