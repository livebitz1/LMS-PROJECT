import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Empty } from '@/components/ui/empty';
import { useRouter } from 'next/navigation';

export type LearnerBooking = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherProfileImageUrl?: string | null;
  createdAt: string;
  message?: string | null;
};

export function LearnerBookings({ bookings }: { bookings: LearnerBooking[] }) {
  const router = useRouter();
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-emerald-700">Your Booked Teachers</span>
          <Badge variant="outline" className="text-xs">{bookings.length}</Badge>
        </div>
        <Separator className="mt-2" />
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <Empty className="py-12 text-center text-slate-400">No bookings yet.</Empty>
        ) : (
          <div className="grid gap-6">
            {bookings.map((b) => (
              <Card key={b.id} className="border border-emerald-100 bg-white/80 shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="size-12">
                    <AvatarImage src={b.teacherProfileImageUrl || undefined} alt={b.teacherName || 'Teacher'} />
                    <AvatarFallback>{b.teacherName ? b.teacherName[0] : '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-base text-emerald-900">{b.teacherName}</div>
                    <Badge variant="secondary" className="text-xs">Teacher</Badge>
                    <button
                      type="button"
                      disabled={!b.teacherId}
                      onClick={() => b.teacherId && router.push(`/teacher/${b.teacherId}`)}
                      className={`inline-block mt-2 px-3 py-1 text-xs rounded bg-emerald-100 text-emerald-800 font-medium hover:bg-emerald-200 transition-colors${!b.teacherId ? ' opacity-50 cursor-not-allowed' : ''}`}
                      title={b.teacherId ? `View ${b.teacherName}'s profile` : 'Profile link unavailable'}
                    >
                      View Profile
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  {b.message && <div className="text-sm text-slate-700 mb-1">Message: <span className="font-medium text-emerald-700">{b.message}</span></div>}
                  <div className="text-xs text-slate-400">Booked on {new Date(b.createdAt).toLocaleString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
