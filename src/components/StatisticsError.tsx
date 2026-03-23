import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default function StatisticsError() {
  const handleReload = () => {
    window.location.reload()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Statistik nicht verfügbar
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Die Statistik konnte nicht geladen werden. Möglicherweise ist eine neue Version verfügbar.
        </p>
        <Button onClick={handleReload} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Seite neu laden
        </Button>
      </CardContent>
    </Card>
  )
}
