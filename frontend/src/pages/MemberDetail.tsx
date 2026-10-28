import { useParams } from 'react-router-dom'

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-6" style={{ fontFamily: 'Lexend, sans-serif' }}>
        Member Detail
      </h1>
      <p className="text-muted-foreground">
        Details for member <span className="font-medium text-foreground">{id}</span> will appear here.
      </p>
    </div>
  )
}
