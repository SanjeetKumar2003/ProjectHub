"use client";

import { useState } from "react";
import {
  createComment,
  deleteProjects,
  type getProjects,
  toggleLike,
  deleteComment,
} from "@/actions/projectAction";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { CardContainer, CardItem } from "@/components/ui/3d-card";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  ExternalLink,
  SendIcon,
  Delete,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

import { DeleteAlertDialog } from "@/components/projects/DeleteButton";
import { getUserByUserName } from "@/data/user";

type User = Awaited<ReturnType<typeof getUserByUserName>>;

type Projects = Awaited<ReturnType<typeof getProjects>>;
type Project = Projects[number];

const ProjectCard = ({
  project,
  userId,
  currentUser,
}: {
  project: Project;
  userId: string;
  currentUser: NonNullable<User>;
}) => {
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [hasLiked, setHasLiked] = useState(
    project.likes.some((like) => like.userId === userId)
  );
  const [optimisticLiked, setOptimisticLiked] = useState(project._count.likes);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCommentDeleting, setIsCommentDeleting] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    setHasLiked((prev) => !prev);
    setOptimisticLiked((prev) => prev + (hasLiked ? -1 : 1));
    try {
      await toggleLike(project.id, userId);
    } catch {
      setOptimisticLiked(project._count.likes);
      setHasLiked(project.likes.some((like) => like.userId === userId));
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const result = await createComment(project.id, newComment, userId);
      if (result?.success) {
        toast.success("Comment posted successfully");
        setNewComment("");
      }
    } catch {
      toast.error("Error commenting on project");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (isCommentDeleting) return;

    try {
      setIsCommentDeleting(true);
      const result = await deleteComment(commentId, userId);
      if (result?.success) {
        toast.success("Comment deleted successfully");
        // Ideally, update the UI state to remove the deleted comment
      } else {
        throw new Error(result.error);
      }
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setIsCommentDeleting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deleteProjects(project.id, userId);
      if (result.success) toast.success("Project deleted successfully");
      else throw new Error(result.error);
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href={project.author.userName || ""}>
              <Avatar className="h-12 w-12 border-2 border-primary/10">
                <AvatarImage
                  src={
                    project.author.image ??
                    `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(
                      project.author.name ?? ""
                    )}`
                  }
                />
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link
                href={project.author.userName || ""}
                className="font-semibold hover:underline"
              >
                {project.author.name}
              </Link>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>@{project.author.userName}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(project.createdAt))} ago
                </span>
              </div>
            </div>
            {currentUser.id === project.author.id && (
              <DeleteAlertDialog
                isDeleting={isDeleting}
                onDelete={handleDeleteProject}
              />
            )}
          </div>

          <CardContainer className="w-ful flex py-2 ">
            <div className="w-full">
              <CardItem>
                <h2 className="text-xl font-bold">{project.title}</h2>
              </CardItem>
              <CardItem>
                <p className="text-muted-foreground text-sm py-1 line-clamp-2">
                  {project.description}
                </p>
              </CardItem>
              <CardItem className="w-full">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                  <Image
                    src={project.imageUrl || ""}
                    alt={project.title}
                    fill
                    className="object-cover w-36 h-36"
                  />
                </div>
              </CardItem>
            </div>
          </CardContainer>

          <div className="flex flex-col    ">
            <div className=" w-[90%] inline-flex justify-between items-center  text-muted-foreground">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  disabled={isLiking}
                  className="flex items-center justify-between gap-1"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      hasLiked ? "text-red-500 fill-current" : ""
                    }`}
                  />
                  <span className="text-sm">{optimisticLiked}</span>
                </motion.button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{project._count.comments}</span>
                </Button>
              </div>
              <div>
                <Link href={`project/${project.id}`} className="ml-auto">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" /> View Details
                  </Button>
                </Link>
                <Link href={project.Link || ""} className="ml-auto">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" /> use project
                  </Button>
                </Link>
              </div>
            </div>

            {showComments && (
              <div className="space-y-4 py-3 w-full">
                <Separator />
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                    rows={1}
                    autoFocus
                  />
                  <Button
                    onClick={handleComment}
                    disabled={isCommenting || !newComment.trim()}
                  >
                    {isCommenting ? (
                      "Posting..."
                    ) : (
                      <>
                        <SendIcon className="size-4" />
                        Comment
                      </>
                    )}
                  </Button>
                </div>

                <div className="h-[200px] overflow-y-auto space-y-4">
                  {project.comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            comment.author?.image ??
                            `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(
                              comment.author?.name ?? ""
                            )}`
                          }
                        />
                      </Avatar>
                      <div className="flex-1">
                        <span className="font-semibold text-xl">
                          {comment.author?.name}
                        </span>{" "}
                        <span className="text-sm text-muted-foreground">
                          @{comment.author?.userName}{" "}
                        </span>{" "}
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      {comment.authorId === userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCommentDelete(comment.id)}
                          disabled={isCommentDeleting}
                        >
                          <Delete className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
