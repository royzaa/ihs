import IHS from './ihs.js';

let instance: Consent | undefined;

export class Consent {
	constructor(private readonly ihs: IHS) {}

	/**
	 * Fungsi dari API ini adalah untuk mendapatkan data terkait resource Consent yang
	 * tersedia di ekosistem SatuSehat. Jika status 2xx return `Consent` dan selain
	 * itu return `OperationOutcome` termasuk status 5xx.
	 *
	 * @param patientId IHS patient id
	 * @returns FHIR resource `Consent` or `OperationOutcome`.
	 */
	async get(patientId: string): Promise<fhir4.Consent | fhir4.OperationOutcome> {
		try {
			const authResult = await this.ihs.auth();
			const url = new URL(this.ihs.baseUrls.consent + '/Consent');
			url.searchParams.set('patient_id', patientId);
			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${authResult['access_token']}`
				}
			});
			if (response.status >= 500) {
				throw new Error(await response.text());
			}
			return await response.json();
		} catch (error) {
			return this.exception(error);
		}
	}

	/**
	 * Fungsi dari API ini adalah untuk melakukan perubahan data terkait resource Consent
	 * ke dalam ekosistem SatuSehat, yang sebelumnya sudah ditambahkan dan tersedia di
	 * dalam ekosistem SatuSehat. Jika status 2xx return `Consent` dan selain itu return
	 * `OperationOutcome` termasuk status 5xx.
	 *
	 * @returns FHIR resource `Consent` or `OperationOutcome`.
	 */
	async update(data: {
		/** IHS patient id yang akan dilakukan proses persetujuan */
		patientId: string;

		/**
		 * Aksi persetujuan yang akan dilakukan. Isi dengan `OPTIN` bila akses disetujui,
		 * sedangkan bila ditolak isi dengan `OPTOUT`. Persetujuan yang dimaksud adalah
		 * bersedia dan menyetujui data rekam medis milik pasien diakses dari Fasilitas
		 * Pelayanan Kesehatan lainnya melalui Platform SatuSehat untuk kepentingan
		 * pelayanan kesehatan dan/atau rujukan. **Tidak berarti** pengiriman data rekam
		 * medis tidak dilakukan jika pasien `OPTOUT`.
		 */
		action: 'OPTIN' | 'OPTOUT';

		/**
		 * Nama agen atau petugas yang ingin meminta persetujuan.
		 */
		agent: string;
	}) {
		try {
			const authResult = await this.ihs.auth();
			const url = new URL(this.ihs.baseUrls.consent + '/Consent');
			const payload = JSON.stringify({ patient_id: data.patientId, ...data });
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${authResult['access_token']}`,
					'Content-Type': 'application/json'
				},
				body: payload
			});
			if (response.status >= 500) {
				throw new Error(await response.text());
			}
			return await response.json();
		} catch (error) {
			return this.exception(error);
		}
	}

	private exception(error: unknown): fhir4.OperationOutcome {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const text = (error as any)?.message || 'unknown error';
		return {
			resourceType: 'OperationOutcome',
			issue: [
				{
					code: 'exception',
					severity: 'error',
					details: { text }
				}
			]
		};
	}
}

export function getConsentSingleton(...params: ConstructorParameters<typeof Consent>): Consent {
	if (!instance) instance = new Consent(...params);
	return instance;
}
