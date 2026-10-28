import { ExternalLink } from 'lucide-react'
import Button from '../../components/ui/Button'
import StatsBoard from '../../components/feature/StatsBoard'
import { AdminHead } from './kit'

export default function StatsPreview() {
  return (
    <div>
      <AdminHead kicker="Growth" title="Public stats" actions={<Button size="sm" variant="outline" icon={ExternalLink} to="/stats">Open /stats</Button>}>
        What sponsors see on the pitch page. The numbers include the seeded demo data (captain's decision), so call that out when presenting them.
      </AdminHead>
      <StatsBoard compact />
    </div>
  )
}
