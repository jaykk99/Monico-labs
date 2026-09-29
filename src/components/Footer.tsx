import React from "react";
import Link from "next/link";
import { Github, Twitter, BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 p-6 text-neutral-500 text-sm">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-center md:text-left">
          &copy; {new Date().getFullYear()} Error-Inbox. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href="/docs" className="hover:text-neutral-300 flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Docs
          </Link>
          <a
            href="https://github.com/cfd-technical/error-inbox"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 flex items-center gap-1"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://twitter.com/cfd_tech"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 flex items-center gap-1"
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}