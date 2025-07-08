import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-8 md:p-12">
          <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-[#a3a3a3] mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-[#a3a3a3] mb-4">
                By accessing or using myRoundTable.io (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). 
                If you disagree with any part of these terms, then you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
              <p className="text-[#a3a3a3] mb-4">
                Permission is granted to temporarily use the Service for personal, non-commercial transitory viewing only. 
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-[#a3a3a3] mb-4 space-y-2">
                <li>modify or copy the materials;</li>
                <li>use the materials for any commercial purpose or for any public display;</li>
                <li>attempt to reverse engineer any software contained on the Service;</li>
                <li>remove any copyright or other proprietary notations from the materials; or</li>
                <li>transfer the materials to another person or &quot;mirror&quot; the materials on any other server.</li>
              </ul>
              <p className="text-[#a3a3a3] mb-4">
                This license shall automatically terminate if you violate any of these restrictions and may be terminated 
                by myRoundTable.io at any time. Upon terminating your viewing of these materials or upon the termination 
                of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Disclaimer</h2>
              <p className="text-[#a3a3a3] mb-4">
                The materials on myRoundTable.io are provided on an &apos;as is&apos; basis. myRoundTable.io makes no warranties, 
                expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, 
                implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
                of intellectual property or other violation of rights.
              </p>
              <p className="text-[#a3a3a3] mb-4">
                Further, myRoundTable.io does not warrant or make any representations concerning the accuracy, likely results, 
                or reliability of the use of the materials on its website or otherwise relating to such materials or on any 
                sites linked to this site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Limitations</h2>
              <p className="text-[#a3a3a3] mb-4">
                In no event shall myRoundTable.io or its suppliers be liable for any damages (including, without limitation, 
                damages for loss of data or profit, or due to business interruption) arising out of the use or inability to 
                use the materials on myRoundTable.io, even if myRoundTable.io or a myRoundTable.io authorized representative 
                has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not 
                allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, 
                these limitations may not apply to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Accuracy of Materials</h2>
              <p className="text-[#a3a3a3] mb-4">
                The materials appearing on myRoundTable.io could include technical, typographical, or photographic errors. 
                myRoundTable.io does not warrant that any of the materials on its website are accurate, complete, or current. 
                myRoundTable.io may make changes to the materials contained on its website at any time without notice. 
                However, myRoundTable.io does not make any commitment to update the materials.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Links</h2>
              <p className="text-[#a3a3a3] mb-4">
                myRoundTable.io has not reviewed all of the sites linked to its website and is not responsible for the 
                contents of any such linked site. The inclusion of any link does not imply endorsement by myRoundTable.io 
                of the site. Use of any such linked website is at the user&apos;s own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Modifications</h2>
              <p className="text-[#a3a3a3] mb-4">
                myRoundTable.io may revise these terms of service for its website at any time without notice. By using this 
                website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Governing Law</h2>
              <p className="text-[#a3a3a3] mb-4">
                These terms and conditions are governed by and construed in accordance with the laws of the United States 
                and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Information</h2>
              <p className="text-[#a3a3a3] mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-6 mt-4">
                <p className="text-white font-semibold mb-2">myRoundTable.io</p>
                <p className="text-[#a3a3a3]">Email: support@myroundtable.io</p>
                <p className="text-[#a3a3a3]">Website: https://myroundtable.io</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-[#2a2a2a]">
              <Link 
                href="/" 
                className="inline-flex items-center text-[#3b82f6] hover:text-[#2563eb] transition-colors duration-200"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}