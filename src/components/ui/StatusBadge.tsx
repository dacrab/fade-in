import { useTranslation } from "react-i18next"
import type { AppointmentStatus } from "#/types"
import { STATUS_BADGE } from "#/types"

export default function StatusBadge({ status }: { status: AppointmentStatus }) {
	const { t } = useTranslation()
	return <span className={`badge ${STATUS_BADGE[status]}`}>{t(`status.${status}`)}</span>
}
