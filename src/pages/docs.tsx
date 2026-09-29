import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
import Footer from "../components/Footer"; // Import the Footer component

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      <Head>
        <title>Documentation | Error-Inbox</title>
        <meta name="description" content="Documentation for Error-Inbox, a real-time error monitoring and analytics platform." />
      </Head>

      {/* Header */}
      <header className="border-b border-neutral-800 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-neutral-100 hover:text-purple-400 transition-colors">
            Error-Inbox
          </Link>
          <nav>
            <Link href="/" className="text-neutral-400 hover:text-neutral-100 flex items-center gap-1">
              <Home className="h-4 w-4" /> Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="md:col-span-1 border-r border-neutral-800 pr-8">
          <nav className="space-y-2">
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Table of Contents</h3>
            <ul className="space-y-2">
              <li>
                <a href="#introduction" className="flex items-center gap-2 text-neutral-400 hover:text-purple-400 transition-colors">
                  <ChevronRight className="h-4 w-4" /> Introduction
                </a>
              </li>
              <li>
                <a href="#getting-started" className="flex items-center gap-2 text-neutral-400 hover:text-purple-400 transition-colors">
                  <ChevronRight className="h-4 w-4" /> Getting Started
                </a>
              </li>
              <li>
                <a href="#integration" className="flex items-center gap-2 text-neutral-400 hover:text-purple-400 transition-colors">
                  <ChevronRight className="h-4 w-4" /> Integration Guide
                </a>
              </li>
              <li>
                <a href="#api-reference" className="flex items-center gap-2 text-neutral-400 hover:text-purple-400 transition-colors">
                  <ChevronRight className="h-4 w-4" /> API Reference
                </a>
              </li>
              <li>
                <a href="#troubleshooting" className="flex items-center gap-2 text-neutral-400 hover:text-purple-400 transition-colors">
                  <ChevronRight className="h-4 w-4" /> Troubleshooting
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Documentation Content */}
        <article className="md:col-span-3 prose prose-invert prose-purple max-w-none">
          <h1 className="text-4xl font-extrabold text-neutral-100 mb-6">Error-Inbox Documentation</h1>

          <section id="introduction" className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-100 mb-4">Introduction</h2>
            <p>Welcome to the official documentation for Error-Inbox, your real-time solution for comprehensive error monitoring and analytics. This platform is designed to provide developers with instant visibility into application health, performance bottlenecks, and user experience issues. With Error-Inbox, you can proactively identify, diagnose, and resolve errors before they impact your users.</p>
            <p>Our powerful analytics dashboard offers a centralized view of your application's telemetry, including request rates, bandwidth usage, latency, and core web vitals. By integrating our lightweight SDK, you gain access to detailed error reports, agent performance metrics, and deployment logs, all presented in an intuitive and interactive interface.</p>
          </section>

          <section id="getting-started" className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-100 mb-4">Getting Started</h2>
            <p>To begin using Error-Inbox, follow these simple steps:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Sign Up/Log In:</strong> Create an account or log in to your existing Error-Inbox dashboard.</li>
              <li><strong>Create a Project:</strong> From your dashboard, create a new project. You will be provided with a unique Project ID and API Key.</li>
              <li><strong>Install the SDK:</strong> Integrate our SDK into your application. We provide libraries for various languages and frameworks.</li>
              <li><strong>Configure Your Application:</strong> Use your Project ID and API Key to configure the SDK in your application.</li>
              <li><strong>Start Monitoring:</strong> Deploy your application, and Error-Inbox will automatically begin collecting error data and performance metrics.</li>
            </ol>
            <p className="mt-4">For detailed integration instructions, please refer to the <Link href="#integration" className="text-purple-400 hover:underline">Integration Guide</Link>.</p>
          </section>

          <section id="integration" className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-100 mb-4">Integration Guide</h2>
            <p>Integrating Error-Inbox into your application is straightforward. Choose your preferred environment:</p>
            <h3 className="text-2xl font-semibold text-neutral-100 mt-6 mb-3">JavaScript/TypeScript (Web & Node.js)</h3>
            <p>Install the SDK:</p>
            <pre className="bg-neutral-900 p-4 rounded-md text-sm overflow-x-auto"><code>npm install @error-inbox/sdk</code></pre>
            <p>Initialize in your application entry point:</p>
            <pre className="bg-neutral-900 p-4 rounded-md text-sm overflow-x-auto"><code>
import &#123; ErrorInbox &#125; from '@error-inbox/sdk';<br/><br/>
ErrorInbox.init(&#123;<br/>
&nbsp;&nbsp;projectId: 'YOUR_PROJECT_ID',<br/>
&nbsp;&nbsp;apiKey: 'YOUR_API_KEY',<br/>
&nbsp;&nbsp;environment: 'production', // or 'development', 'staging'<br/>
&#125;);<br/><br/>
// Example error capture<br/>
try &#123;<br/>
&nbsp;&nbsp;throw new Error('This is a test error!');<br/>
&#125; catch (error) &#123;<br/>
&nbsp;&nbsp;ErrorInbox.captureException(error);<br/>
&#125;
            </code></pre>
            <h3 className="text-2xl font-semibold text-neutral-100 mt-6 mb-3">Other Environments</h3>
            <p>We are continuously expanding our SDK support. For other languages and frameworks (Python, Ruby, Go, etc.), please refer to our GitHub repository or contact support for pre-release information.</p>
          </section>

          <section id="api-reference" className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-100 mb-4">API Reference</h2>
            <p>The Error-Inbox SDK provides a simple yet powerful API for custom error reporting and context enrichment.</p>
            <h3 className="text-2xl font-semibold text-neutral-100 mt-6 mb-3"><code>ErrorInbox.init(options)</code></h3>
            <p>Initializes the SDK. Must be called once at the start of your application.</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code>projectId: string</code> (Required) Your unique project identifier.</li>
              <li><code>apiKey: string</code> (Required) Your project's API key.</li>
              <li><code>environment?: string</code> (Optional) e.g., 'production', 'development'. Defaults to 'production'.</li>
              <li><code>release?: string</code> (Optional) Current application release version.</li>
            </ul>

            <h3 className="text-2xl font-semibold text-neutral-100 mt-6 mb-3"><code>ErrorInbox.captureException(error, context?)</code></h3>
            <p>Captures an exception and sends it to Error-Inbox.</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code>error: Error</code> (Required) The error object to capture.</li>
              <li><code>context?: object</code> (Optional) Additional context to attach to the error (e.g., user info, request data).</li>
            </ul>

            <h3 className="text-2xl font-semibold text-neutral-100 mt-6 mb-3"><code>ErrorInbox.captureMessage(message, level?, context?)</code></h3>
            <p>Captures a non-error message.</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code>message: string</code> (Required) The message string.</li>
              <li><code>level?: 'info' | 'warning' | 'error'</code> (Optional) Severity level. Defaults to 'info'.</li>
              <li><code>context?: object</code> (Optional) Additional context.</li>
            </ul>
          </section>

          <section id="troubleshooting" className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-100 mb-4">Troubleshooting</h2>
            <p>Encountering issues? Here are some common solutions:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>401 Unauthorized Errors:</strong> Double-check your <code>projectId</code> and <code>apiKey</code>. Ensure they are correct and have the necessary permissions.</li>
              <li><strong>No Data Appearing:</strong> Verify that the SDK is correctly initialized and that <code>captureException</code> or <code>captureMessage</code> are being called in your code. Check your browser's network tab for any failed requests to the Error-Inbox API.</li>
              <li><strong>CORS Issues:</strong> Ensure your application's domain is configured as an allowed origin in your Error-Inbox project settings if you are seeing CORS errors in the browser console.</li>
              <li><strong>SDK Not Loading:</strong> Check your application's build process to ensure the Error-Inbox SDK is properly bundled and not blocked by any content security policies.</li>
            </ul>
            <p className="mt-4">If you've tried these steps and are still experiencing problems, please don't hesitate to reach out to our support team through the dashboard or by opening an issue on our <a href="https://github.com/cfd-technical/error-inbox" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">GitHub repository</a>.</p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}