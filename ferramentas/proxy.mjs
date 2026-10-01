// Impressão digital (SPKI) do certificado do proxy deste ambiente, para o Chromium aceitar só ele.
// Calculada na hora: o certificado muda entre sessões.
import { X509Certificate, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const spkiProxy = () => createHash('sha256')
  .update(new X509Certificate(readFileSync('/root/.ccr/agent-proxy-ca.crt')).publicKey.export({ type: 'spki', format: 'der' }))
  .digest('base64');
