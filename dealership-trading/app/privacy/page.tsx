import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-8 md:p-12">
          <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-[#a3a3a3] mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-[#a3a3a3] mb-4">
                Welcome to myRoundTable.io (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              <p className="text-[#a3a3a3] mb-4">
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul className="list-disc list-inside text-[#a3a3a3] mb-4 space-y-2">
                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-[#a3a3a3] mb-4">
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-[#a3a3a3] mb-4 space-y-2">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
              <p className="text-[#a3a3a3] mb-4">
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, 
                altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a 
                business need to know. They will only process your personal data on our instructions and they are subject to a duty of confidentiality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
              <p className="text-[#a3a3a3] mb-4">
                We will only retain your personal data for as long as reasonably necessary to fulfil the purposes we collected it for, including for the purposes 
                of satisfying any legal, regulatory, tax, accounting or reporting requirements. We may retain your personal data for a longer period in the event 
                of a complaint or if we reasonably believe there is a prospect of litigation in respect to our relationship with you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Legal Rights</h2>
              <p className="text-[#a3a3a3] mb-4">
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
              </p>
              <ul className="list-disc list-inside text-[#a3a3a3] mb-4 space-y-2">
                <li>Request access to your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request erasure of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Request transfer of your personal data</li>
                <li>Right to withdraw consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies</h2>
              <p className="text-[#a3a3a3] mb-4">
                Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse 
                our website and also allows us to improve our site. By continuing to browse the site, you are agreeing to our use of cookies.
              </p>
              <p className="text-[#a3a3a3] mb-4">
                A cookie is a small file of letters and numbers that we store on your browser or the hard drive of your computer if you agree. Cookies contain 
                information that is transferred to your computer&apos;s hard drive.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Links</h2>
              <p className="text-[#a3a3a3] mb-4">
                This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow 
                third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements. 
                When you leave our website, we encourage you to read the privacy policy of every website you visit.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-[#a3a3a3] mb-4">
                Our Service does not address anyone under the age of 18 (&quot;Children&quot;). We do not knowingly collect personally identifiable information from 
                anyone under the age of 18. If you are a parent or guardian and you are aware that your Child has provided us with Personal Data, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-[#a3a3a3] mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating 
                the &quot;Last updated&quot; date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
              <p className="text-[#a3a3a3] mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-6 mt-4">
                <p className="text-white font-semibold mb-2">myRoundTable.io</p>
                <p className="text-[#a3a3a3]">Email: privacy@myroundtable.io</p>
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