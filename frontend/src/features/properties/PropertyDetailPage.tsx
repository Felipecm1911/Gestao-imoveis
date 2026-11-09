import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ImagePlus, Pencil, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApiError } from '@/lib/api'
import { formatBRL, propertyStatusLabel, propertyTypeLabel } from '@/lib/format'
import {
  useChangeStatus,
  useDeletePhoto,
  useDeleteProperty,
  useProperty,
  useSetCover,
  useUploadPhotos,
  type Property,
  type PropertyStatus,
} from './api'
import { StatusBadge } from './StatusBadge'

const errorToast = (fallback: string) => (e: unknown) => toast.error(e instanceof ApiError ? e.message : fallback)

function Gallery({ property }: { property: Property }) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadPhotos(property.id)
  const remove = useDeletePhoto(property.id)
  const cover = useSetCover(property.id)
  const [selected, setSelected] = useState(0)
  const photos = property.photos
  const current = photos[Math.min(selected, photos.length - 1)]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fotos ({photos.length}/20)</CardTitle>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ''
            if (files.length) {
              upload.mutate(files, { onSuccess: () => toast.success('Fotos enviadas'), onError: errorToast('Falha no envio') })
            }
          }}
        />
        <Button variant="outline" size="sm" disabled={upload.isPending || photos.length >= 20} onClick={() => input.current?.click()}>
          <ImagePlus /> {upload.isPending ? 'Enviando…' : 'Adicionar fotos'}
        </Button>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma foto ainda. JPEG, PNG ou WebP até 5 MB cada.</p>
        ) : (
          <div className="grid gap-3">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <img src={current.url} alt={`Foto ${selected + 1} de ${photos.length}`} className="size-full object-contain" />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <Button size="sm" variant="secondary" disabled={current.cover || cover.isPending}
                  onClick={() => cover.mutate(current.id, { onError: errorToast('Não foi possível definir a capa') })}>
                  <Star className={current.cover ? 'fill-current' : ''} /> {current.cover ? 'Capa' : 'Usar como capa'}
                </Button>
                <Button size="sm" variant="destructive" disabled={remove.isPending} aria-label="Excluir foto"
                  onClick={() => remove.mutate(current.id, { onSuccess: () => setSelected(0), onError: errorToast('Falha ao excluir') })}>
                  <Trash2 />
                </Button>
              </div>
            </div>
            <ul className="flex gap-2 overflow-x-auto" aria-label="Miniaturas">
              {photos.map((photo, i) => (
                <li key={photo.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    aria-label={`Ver foto ${i + 1}${photo.cover ? ' (capa)' : ''}`}
                    aria-current={i === selected}
                    className="block size-16 overflow-hidden rounded-md border-2 border-transparent aria-[current=true]:border-primary"
                  >
                    <img src={photo.url} alt="" className="size-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const property = useProperty(id)
  const changeStatus = useChangeStatus(id!)
  const remove = useDeleteProperty()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (property.isPending) return <LoadingRows rows={8} />
  if (property.isError) return <ErrorState error={property.error} onRetry={() => property.refetch()} />
  const p = property.data

  const facts: [string, string][] = [
    ['Tipo', propertyTypeLabel[p.type]],
    ['Proprietário', p.owner.name],
    ['Endereço', `${p.street}, ${p.number}${p.complement ? ` - ${p.complement}` : ''}`],
    ['Bairro / cidade', `${p.district} · ${p.city}/${p.state}`],
    ['CEP', p.zip.replace(/(\d{5})(\d{3})/, '$1-$2')],
    ['Área', p.areaM2 !== null ? `${p.areaM2} m²` : '—'],
    ['Quartos · banheiros · vagas', `${p.bedrooms} · ${p.bathrooms} · ${p.parking}`],
    ['Aluguel sugerido', formatBRL(p.suggestedRent)],
  ]

  return (
    <>
      <PageHeader
        title={p.title}
        description={p.code}
        actions={
          <>
            <Button variant="outline" asChild><Link to={`/app/properties/${p.id}/edit`}><Pencil /> Editar</Link></Button>
            <Button variant="outline" onClick={() => setConfirmDelete(true)}><Trash2 /> Excluir</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Gallery property={p} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Dados</CardTitle>
            <StatusBadge status={p.status} />
          </CardHeader>
          <CardContent className="grid gap-4">
            <dl className="grid gap-3 text-sm">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {p.description && <p className="text-sm whitespace-pre-line">{p.description}</p>}
            {p.status !== 'OCUPADO' && (
              <div className="grid gap-1.5">
                <span className="text-sm text-muted-foreground" id="status-label">Alterar situação</span>
                <Select
                  value={p.status}
                  disabled={changeStatus.isPending}
                  onValueChange={(v) => changeStatus.mutate(v as PropertyStatus, { onError: errorToast('Não foi possível alterar') })}
                >
                  <SelectTrigger aria-labelledby="status-label" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['DISPONIVEL', 'MANUTENCAO', 'INATIVO'] as const).map((s) => (
                      <SelectItem key={s} value={s}>{propertyStatusLabel[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir imóvel?"
        description={`${p.code} e suas fotos serão removidos definitivamente.`}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          remove.mutate(p.id, {
            onSuccess: () => {
              toast.success('Imóvel excluído')
              navigate('/app/properties')
            },
            onError: errorToast('Não foi possível excluir'),
          })
        }
      />
    </>
  )
}
