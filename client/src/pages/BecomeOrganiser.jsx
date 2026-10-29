import { Link } from 'react-router'
import OrganiserApply from '../components/feature/OrganiserApply'
import { PageHead } from '../components/ui/Bits'
import { useAuth } from '../context/AuthContext'

export default function BecomeOrganiser() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHead kicker={{ num: 'HOST', text: 'Organiser' }} title="Become an organiser">
        Create an application to host rooms and run tournaments for your community.
      </PageHead>
      {user ? (
        <OrganiserApply />
      ) : (
        <div className="border-2 border-paper/15 p-6">
          <p className="display text-3xl">Log in to apply</p>
          <Link to="/login" state={{ from: '/become-organiser' }} className="mt-4 inline-block text-marigold underline">
            Continue to login
          </Link>
        </div>
      )}
    </div>
  )
}
