import { getSession } from "@/lib/auth";
import UserClient from "@/components/user-client";

export default async function UsersPage() {
  const session = await getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">用户管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          查看所有注册用户，仅可修改自己的密码
        </p>
      </div>
      <UserClient currentUserId={session?.id ?? null} />
    </div>
  );
}