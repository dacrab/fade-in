import { useMutation } from "convex/react"
import { ImagePlus, LoaderCircle, Trash2, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { showToast } from "#/components/ui/Toast"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

interface ImageUploadProps {
	images: string[]
	onAdd: (url: string) => void
	onRemove: (url: string) => void
	maxImages?: number
	barbershopId?: Id<"barbershops">
}

export function ImageUpload({
	images,
	onAdd,
	onRemove,
	maxImages = 5,
	barbershopId,
}: ImageUploadProps) {
	const { t } = useTranslation()
	const inputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl)
	const saveShopImage = useMutation(api.storage.saveShopImage)

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!(file && barbershopId)) return

		if (file.size > 5 * 1024 * 1024) {
			showToast(t("errors.fileTooLarge"), "error")
			return
		}

		setUploading(true)
		try {
			const postUrl = await generateUploadUrl()
			const result = await fetch(postUrl, {
				method: "POST",
				body: file,
			})
			if (!result.ok) throw new Error("Upload failed")
			const { storageId } = await result.json()
			const url = await saveShopImage({ barbershopId, storageId })
			onAdd(url)
			showToast(t("errors.imageUploaded"), "success")
		} catch {
			showToast(t("errors.uploadFailed"), "error")
		} finally {
			setUploading(false)
			if (inputRef.current) inputRef.current.value = ""
		}
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-3">
				{images.map((url) => (
					<div
						key={url}
						className="relative group w-20 h-20 rounded-lg overflow-hidden border border-(--border)"
					>
						<img src={url} alt="" className="w-full h-full object-cover" />
						<button
							type="button"
							onClick={() => onRemove(url)}
							className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
						>
							<Trash2 size={16} className="text-white" />
						</button>
					</div>
				))}
				{images.length < maxImages && (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						disabled={uploading}
						className="w-20 h-20 rounded-lg border-2 border-dashed border-(--border) flex items-center justify-center text-(--text-subtle) hover:text-(--gold) hover:border-(--gold) transition-colors cursor-pointer disabled:opacity-40"
					>
						{uploading ? <LoaderCircle size={18} className="animate-spin" /> : <ImagePlus size={18} />}
					</button>
				)}
			</div>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={(e) => void handleUpload(e)}
				className="hidden"
			/>
		</div>
	)
}

interface AvatarUploadProps {
	avatarUrl?: string
	barberId: Id<"barbers">
	onUpdate: (url: string) => void
}

export function AvatarUpload({ avatarUrl, barberId, onUpdate }: AvatarUploadProps) {
	const { t } = useTranslation()
	const inputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl)
	const saveAvatar = useMutation(api.storage.saveBarberAvatar)

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (file.size > 2 * 1024 * 1024) {
			showToast(t("errors.fileTooLarge"), "error")
			return
		}

		setUploading(true)
		try {
			const postUrl = await generateUploadUrl()
			const result = await fetch(postUrl, {
				method: "POST",
				body: file,
			})
			if (!result.ok) throw new Error("Upload failed")
			const { storageId } = await result.json()
			const url = await saveAvatar({ barberId, storageId })
			onUpdate(url)
			showToast(t("errors.imageUploaded"), "success")
		} catch {
			showToast(t("errors.uploadFailed"), "error")
		} finally {
			setUploading(false)
			if (inputRef.current) inputRef.current.value = ""
		}
	}

	return (
		<div className="flex items-center gap-4">
			<button
				type="button"
				className="relative w-16 h-16 rounded-full overflow-hidden bg-(--gold)/10 flex items-center justify-center ring-2 ring-(--gold)/15 group cursor-pointer"
				onClick={() => inputRef.current?.click()}
			>
				{avatarUrl ? (
					<img src={avatarUrl} alt="" className="w-full h-full object-cover" />
				) : (
					<Upload size={18} className="text-(--text-subtle)" />
				)}
				{uploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/40">
						<LoaderCircle size={20} className="text-white animate-spin" />
					</div>
				)}
			</button>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={(e) => void handleUpload(e)}
				className="hidden"
			/>
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				className="text-xs text-(--gold) hover:underline"
			>
				{avatarUrl ? t("common.change") : t("common.upload")}
			</button>
		</div>
	)
}
