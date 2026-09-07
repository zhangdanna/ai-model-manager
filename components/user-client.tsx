"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface UserClientProps {
  currentUserId: string | null;
}

const PAGE_SIZE = 10;

export default function UserClient({ currentUserId }: UserClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 分页状态
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [jumpInput, setJumpInput] = useState("");

  // 密码修改弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users?page=${p}&pageSize=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("获取用户列表失败");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchUsers(1);
    })();
  }, [fetchUsers]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    fetchUsers(p);
  };

  const handleJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const target = parseInt(jumpInput);
      if (isNaN(target)) return;
      goToPage(target);
      setJumpInput("");
    }
  };

  const handleChangePassword = async () => {
    setChangeError(null);

    if (newPassword.length < 6) {
      setChangeError("新密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError("两次输入的新密码不一致");
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setChangeError(data.error || "修改失败");
        return;
      }

      setDialogOpen(false);
      router.push("/login");
      router.refresh();
    } catch {
      setChangeError("网络错误，请重试");
    } finally {
      setChanging(false);
    }
  };

  const resetDialog = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangeError(null);
  };

  // 生成页码数组
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 dark:border-red-800 p-12 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 总条数 */}
      <div className="text-sm text-muted-foreground">
        共 <span className="font-medium text-foreground">{total}</span> 个用户
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead className="w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isMe = user.id === currentUserId;

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {isMe && (
                      <span className="ml-2 text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">
                        我
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    {isMe && (
                      <Dialog
                        open={dialogOpen}
                        onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) resetDialog();
                        }}
                      >
                        <DialogTrigger
                          render={<Button variant="outline" size="sm" />}
                        >
                          修改密码
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>修改密码</DialogTitle>
                            <DialogDescription>
                              修改密码后需要重新登录
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="current-password">当前密码</Label>
                              <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="请输入当前密码"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-password">新密码</Label>
                              <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="至少 6 位"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirm-password">确认新密码</Label>
                              <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="再次输入新密码"
                              />
                            </div>
                            {changeError && (
                              <p className="text-sm text-destructive">{changeError}</p>
                            )}
                            <Button
                              className="w-full"
                              onClick={handleChangePassword}
                              disabled={changing}
                            >
                              {changing ? "修改中..." : "确认修改"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  暂无用户
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控件 */}
      {total > 1 && (
        <div className="flex items-center float-right">
          <div className="text-sm text-muted-foreground">
            共 {total} 条
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => { e.preventDefault(); goToPage(page - 1); }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  text="Pre"
                />
              </PaginationItem>

              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={(e) => { e.preventDefault(); goToPage(p); }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={(e) => { e.preventDefault(); goToPage(page + 1); }}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* 跳转 */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">跳至</span>
            <Input
              className="w-14 h-7 text-center text-xs"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              onKeyDown={handleJump}
              placeholder={String(page)}
            />
            <span className="text-muted-foreground">页</span>
          </div>
        </div>
      )}
    </div>
  );
}