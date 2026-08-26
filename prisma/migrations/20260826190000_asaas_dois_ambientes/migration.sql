-- ConfiguracaoAsaas passa de uma linha fixa (id='asaas') pra uma linha por
-- ambiente (id='PRODUCAO' ou id='SANDBOX'), com `ativo` marcando qual está
-- em uso. Preserva a configuração já existente: a linha atual vira a linha
-- do ambiente em que ela já estava, marcada como ativa.

ALTER TABLE "ConfiguracaoAsaas" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- A linha existente (id='asaas') vira a linha do seu próprio ambiente.
UPDATE "ConfiguracaoAsaas" SET id = ambiente::text WHERE id = 'asaas';

ALTER TABLE "ConfiguracaoAsaas" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "ConfiguracaoAsaas" ALTER COLUMN "id" TYPE "AmbienteAsaas" USING (id::"AmbienteAsaas");

ALTER TABLE "ConfiguracaoAsaas" DROP COLUMN "ambiente";
ALTER TABLE "ConfiguracaoAsaas" ALTER COLUMN "ativo" SET DEFAULT false;
