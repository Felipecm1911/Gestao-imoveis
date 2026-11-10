import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Bath, BedDouble, Car, ChevronDown, ChevronRight, FileText, ImagePlus, MapPin, Pencil, Ruler, Star, Trash2, UserRound, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorState, LoadingRows } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApiError } from '@/lib/api'
import { formatBRL, propertyStatusLabel, propertyTypeLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
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
const THUMBS = 4

function Gallery({ property, pickFiles }: { property: Property; pickFiles: () => void }) {
  const remove = useDeletePhoto(property.id)
  const cover = useSetCover(property.id)
  const [selected, setSelected] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const photos = property.photos
  const current = photos[Math.min(selected, photos.length - 1)]
  const shown = showAll ? photos : photos.slice(0, THUMBS)
  const hidden = photos.length - shown.length

  if (photos.length === 0) {
    return (
      <button type="button" onClick={pickFiles}
        className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary">
        <ImagePlus className="size-8" aria-hidden />
        <span className="text-sm font-medium">Adicionar fotos</span>
        <span className="text-xs">JPEG, PNG ou WebP até 5 MB cada</span>
      </button>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        <img src={current.url} alt={`Foto ${selected + 1} de ${photos.length}`} className="size-full object-cover" />
        <div className="absolute right-3 bottom-3 flex gap-2">
          <Button size="sm" variant="secondary" disabled={current.cover || cover.isPending}
            onClick={() => cover.mutate(current.id, { onError: errorToast('Não foi possível definir a capa') })}>
            <Star className={current.cover ? 'fill-current' : ''} /> {current.cover ? 'Capa' : 'Usar como capa'}
          </Button>
          <Button size="icon-sm" variant="secondary" className="text-destructive" disabled={remove.isPending} aria-label="Excluir foto"
            onClick={() => remove.mutate(current.id, { onSuccess: () => setSelected(0), onError: errorToast('Falha ao excluir') })}>
            <Trash2 />
          </Button>
        </div>
      </div>
      <ul className="grid grid-cols-5 gap-2" aria-label="Miniaturas">
        {shown.map((photo, i) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Ver foto ${i + 1}${photo.cover ? ' (capa)' : ''}`}
              aria-current={i === selected}
              className="block aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-transparent aria-[current=true]:border-primary"
            >
              <img src={photo.url} alt="" className="size-full object-cover" />
            </button>
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <button type="button" onClick={() => setShowAll(true)} aria-label={`Ver mais ${hidden} fotos`}
              className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-sidebar text-sm font-semibold text-white">
              +{hidden}
            </button>
          </li>
        )}
        {photos.length < 20 && (hidden === 0) && (
          <li>
            <button type="button" onClick={pickFiles} aria-label="Adicionar fotos"
              className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary">
              <ImagePlus className="size-5" aria-hidden />
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}

function InfoTile({ icon: Icon, label, value, sub, tone }: { icon: typeof Wallet; label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-background/60 p-3">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', tone)}><Icon className="size-4" aria-hidden /></span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{value}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

const tabs = ['Detalhes', 'Contrato', 'Manutenções', 'Documentos', 'Histórico'] as const

export function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const property = useProperty(id)
  const changeStatus = useChangeStatus(id!)
  const upload = useUploadPhotos(id!)
  const remove = useDeleteProperty()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  if (property.isPending) return <LoadingRows rows={8} />
  if (property.isError) return <ErrorState error={property.error} onRetry={() => property.refetch()} />
  const p = property.data
  const pickFiles = () => fileInput.current?.click()

  const facts: [string, string][] = [
    ['Código', p.code],
    ['Tipo', propertyTypeLabel[p.type]],
    ['CEP', p.zip.replace(/(\d{5})(\d{3})/, '$1-$2')],
    ['Área', p.areaM2 !== null ? `${p.areaM2} m²` : '—'],
    ['Quartos', String(p.bedrooms)],
    ['Banheiros', String(p.bathrooms)],
    ['Vagas', String(p.parking)],
    ['Cadastrado em', new Date(p.createdAt).toLocaleDateString('pt-BR')],
  ]

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length) upload.mutate(files, { onSuccess: () => toast.success('Fotos enviadas'), onError: errorToast('Falha no envio') })
        }}
      />

      <nav aria-label="Trilha" className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/app/properties" className="hover:text-foreground hover:underline">Imóveis</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span aria-current="page">{p.code}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Imóvel: {p.code}</h1>
          <StatusBadge status={p.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to={`/app/properties/${p.id}/edit`}><Pencil /> Editar</Link></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Ações <ChevronDown /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={p.photos.length >= 20 || upload.isPending} onSelect={pickFiles}><ImagePlus /> Adicionar fotos</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}><Trash2 /> Excluir imóvel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Gallery property={p} pickFiles={pickFiles} />
          <div className="grid content-start gap-5">
            <div>
              <h2 className="text-xl font-semibold">{propertyTypeLabel[p.type]} – {p.title}</h2>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {p.street}, {p.number}{p.complement ? ` – ${p.complement}` : ''} – {p.district}<br />
                  {p.city} – {p.state} · CEP {p.zip.replace(/(\d{5})(\d{3})/, '$1-$2')}
                </span>
              </p>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 border-y py-3 text-sm">
              {p.areaM2 !== null && <li className="flex items-center gap-1.5"><Ruler className="size-4 text-muted-foreground" aria-hidden />{p.areaM2} m²</li>}
              <li className="flex items-center gap-1.5"><BedDouble className="size-4 text-muted-foreground" aria-hidden />{p.bedrooms} {p.bedrooms === 1 ? 'quarto' : 'quartos'}</li>
              <li className="flex items-center gap-1.5"><Bath className="size-4 text-muted-foreground" aria-hidden />{p.bathrooms} {p.bathrooms === 1 ? 'banheiro' : 'banheiros'}</li>
              <li className="flex items-center gap-1.5"><Car className="size-4 text-muted-foreground" aria-hidden />{p.parking} {p.parking === 1 ? 'vaga' : 'vagas'}</li>
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile icon={Wallet} label="Aluguel sugerido" value={formatBRL(p.suggestedRent)} tone="bg-brand/15 text-brand-solid dark:text-brand" />
              <InfoTile icon={UserRound} label="Proprietário" value={p.owner.name} tone="bg-secondary text-secondary-foreground" />
              <InfoTile icon={FileText} label="Contrato atual" value="Sem contrato" sub="Contratos chegam na próxima versão" tone="bg-accent text-accent-foreground" />
              <InfoTile icon={UserRound} label="Inquilino" value="—" tone="bg-accent text-accent-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Fotos ({p.photos.length}/20)</p>
          </div>
        </CardContent>
      </Card>

      <div role="tablist" aria-label="Seções do imóvel" className="mb-4 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t, i) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={i === 0}
            disabled={i !== 0}
            title={i === 0 ? undefined : 'Em breve'}
            className="-mb-px border-b-2 border-transparent px-4 py-2.5 text-sm whitespace-nowrap text-muted-foreground aria-selected:border-primary aria-selected:font-medium aria-selected:text-foreground disabled:opacity-50"
          >
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label="Detalhes" className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Ficha do imóvel</CardTitle></CardHeader>
          <CardContent className="grid gap-5">
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {p.description && (
              <div>
                <h3 className="mb-1 text-sm font-medium">Descrição</h3>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{p.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Situação</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {p.status === 'OCUPADO' ? (
              <p className="text-sm text-muted-foreground">Imóvel alugado: a situação muda quando o contrato for encerrado.</p>
            ) : (
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
            <Button variant="outline" asChild>
              <Link to={`/app/owners/${p.owner.id}/edit`}><UserRound /> Ver proprietário</Link>
            </Button>
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
