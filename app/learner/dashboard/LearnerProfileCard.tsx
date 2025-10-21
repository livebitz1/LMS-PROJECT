import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LearnerProfileCard({ user }: { user: any }) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
      <Avatar className="w-20 h-20 shadow">
        <AvatarImage src={user.profileImageUrl} alt={user.name || user.email || "Learner"} />
        <AvatarFallback>{(user.name?.[0] || user.email?.[0] || "L").toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <div className="text-2xl font-semibold text-slate-900 truncate mb-1">{user.name || user.email || "Learner"}</div>
        <div className="text-sm text-slate-500 truncate mb-2">{user.email}</div>
        <Separator className="my-2" />
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <Badge variant="secondary">Student</Badge>
          {user.createdAt && (
            <Badge variant="outline">Joined {new Date(user.createdAt).toLocaleDateString()}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
