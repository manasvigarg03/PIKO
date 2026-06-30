import React, { useState } from "react";
import { CommunityPost } from "../types";
import { Send, MessageCircle } from "lucide-react";

interface GrowthTabProps {
  posts: CommunityPost[];
  onAddPost: (commitment: string) => void;
  onCheerPost: (id: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onAddReaction: (postId: string, emoji: string) => void;
  addToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

export default function GrowthTab({
  posts,
  onAddPost,
  onCheerPost,
  onAddComment,
  onAddReaction,
  addToast
}: GrowthTabProps) {
  // Post commitment text
  const [newCommitment, setNewCommitment] = useState("");
  
  // Comment states tracked by post ID
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitment.trim()) {
      addToast("Please write a commitment first.", "warning");
      return;
    }
    onAddPost(newCommitment.trim());
    setNewCommitment("");
    addToast("Commitment published! Stay accountable.", "success");
  };

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(postId, commentText.trim());
    setCommentText("");
    addToast("Comment posted.", "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn p-1">
      
      {/* Public Commitment Editor */}
      <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-xs space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
            ME
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">Publish a Commitment</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Share with friends to increase focus stakes</p>
          </div>
        </div>

        <form onSubmit={handlePostSubmit} className="space-y-3">
          <textarea
            placeholder='e.g. "I will complete my internship presentation slides tonight before 10 PM."'
            value={newCommitment}
            onChange={(e) => setNewCommitment(e.target.value)}
            rows={2}
            className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors resize-none leading-relaxed font-medium"
          />

          <div className="flex justify-between items-center pt-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Accountability Stakes: +50 XP
            </span>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              <Send className="w-3 h-3" />
              <span>Commit Publicly</span>
            </button>
          </div>
        </form>
      </div>

      {/* Community Stream Feed */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Accountability Stream
        </h3>

        <div className="space-y-4">
          {posts.map((post) => {
            const isSelf = post.author === "You";
            return (
              <div
                key={post.id}
                id={`post-card-${post.id}`}
                className="bg-white border border-slate-100 rounded-[2rem] p-5 space-y-4 shadow-xs hover:border-slate-200 transition-colors"
              >
                {/* Author profile */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {post.avatar ? (
                      <img
                        src={post.avatar}
                        alt={post.author}
                        className="w-8.5 h-8.5 rounded-full object-cover border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8.5 h-8.5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {post.author.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="block text-xs font-extrabold text-slate-800 flex items-center leading-none">
                        {post.author}
                        {isSelf && (
                          <span className="ml-1.5 text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                            YOU
                          </span>
                        )}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold mt-1 block uppercase tracking-wider">{post.timeAgo}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                    post.completed
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}>
                    {post.completed ? "✓ COMPLETED" : "● COMMITTED"}
                  </span>
                </div>

                {/* Commitment text block */}
                <p className="text-xs text-slate-600 leading-relaxed font-semibold italic bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  "{post.commitment}"
                </p>

                {/* Interactive Action Row */}
                <div className="flex items-center justify-between pt-3 border-t border-dashed border-slate-100">
                  <div className="flex items-center space-x-3">
                    {/* Clap Cheer Button */}
                    <button
                      id={`cheer-post-${post.id}`}
                      onClick={() => onCheerPost(post.id)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                        post.hasCheered
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-white text-slate-400 border-slate-200/60 hover:bg-slate-50"
                      }`}
                    >
                      <span>👏</span>
                      <span>Cheer</span>
                      <span className="font-mono font-bold text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded-md ml-1">
                        {post.cheersCount}
                      </span>
                    </button>

                    {/* Emoji Reaction panel */}
                    <div className="flex items-center space-x-1">
                      {["🔥", "💪", "🧠"].map((emoji) => {
                        const hasThisReaction = post.reactions.includes(emoji);
                        return (
                          <button
                            key={emoji}
                            id={`react-${post.id}-${emoji}`}
                            onClick={() => onAddReaction(post.id, emoji)}
                            className={`p-1.5 rounded-lg border text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                              hasThisReaction ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-200/60"
                            }`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment trigger */}
                  <button
                    id={`toggle-comment-${post.id}`}
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comments ({post.comments.length})</span>
                  </button>
                </div>

                {/* Comment Section (collapsible) */}
                {activeCommentPostId === post.id && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 animate-fadeIn">
                    {post.comments.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {post.comments.map((comm) => (
                          <div key={comm.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 space-y-0.5 text-xs">
                            <div className="flex justify-between font-bold text-slate-800 text-[10px]">
                              <span>{comm.author}</span>
                              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{comm.timeAgo}</span>
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed mt-0.5">{comm.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write comment input */}
                    <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Write an encouraging reply..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                      />
                      <button
                        type="submit"
                        className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
