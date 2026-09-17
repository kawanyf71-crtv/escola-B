-- NÓIZ — as redes da turma (perfis suspensos)
--
-- ARQUIVO GERADO. Não edite aqui: mexa em src/data/redes.json e rode
-- `npm run sql`. O mesmo JSON alimenta o adaptador local, então a lista do
-- navegador e a lista do banco são sempre a mesma lista.
--
-- Um perfil suspenso é um @ com lugar guardado: não é conta e não é perfil.
-- Este cadastro não verifica identidade de ninguém, não importa nada do
-- Instagram e não manda convite. Quem diz que é a pessoa, é a pessoa.
--
-- São 139 registros — 6 sem nome e 9 sem UF, do jeito que
-- chegaram do grupo. Os handles não foram corrigidos nem completados: quem
-- sabe qual é o @ certo é a dona dele.

create table perfis_suspensos (
  id               uuid primary key default gen_random_uuid(),
  -- A ordem em que a lista chegou. Sem ela o PostgREST devolve o que quiser.
  ordem            int not null,
  -- Null de verdade: algumas entradas só têm o @, e aí o @ vira o rótulo.
  nome             text,
  uf               uf_valida,
  -- Aspas porque `local` é palavra da linguagem; a coluna continua `local`
  -- pra API e pro cliente.
  "local"          text,
  -- Sem @ e em minúsculas. Duas entradas chegaram sem @ nenhum: por isso a
  -- lista pode ser vazia, e por isso não há `check` de tamanho mínimo aqui.
  handles          text[] not null default '{}',
  ocupacao         text,
  linkedin         text,
  -- Handles que a interface mostra como texto, sem virar link.
  nao_linkar       text[] not null default '{}',
  -- Nota de quem montou a lista. Nunca aparece na interface.
  conferir         text,
  -- Uma pessoa segura um @ só, daí o unique. `on delete set null` devolve o
  -- registro pra lista quando alguém apaga a conta.
  reivindicado_por uuid unique references participantes (id) on delete set null,
  removido         boolean not null default false,
  criado_em        timestamptz not null default now()
);

create unique index perfis_suspensos_ordem_idx on perfis_suspensos (ordem);
create index perfis_suspensos_handles_idx on perfis_suspensos using gin (handles);

-- --------------------------------------------------------------------- dados

insert into perfis_suspensos
  (ordem, nome, uf, "local", handles, ocupacao, linkedin, nao_linkar, conferir)
select r.ordem, r.nome, r.uf, r."local", coalesce(r.handles, '{}'),
       r.ocupacao, r.linkedin, coalesce(r.nao_linkar, '{}'), r.conferir
from jsonb_to_recordset($redes$[
 {"ordem":1,"nome":"Aya MorArt","uf":"SP","local":null,"handles":["aya.morart"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":2,"nome":"Igor Oliveira","uf":"SP","local":null,"handles":["igoliveira","perifluxo"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":3,"nome":"Ofe Martins","uf":"SP","local":null,"handles":["ofe_martins","____amnh"],"ocupacao":null,"linkedin":"ofe-martins","nao_linkar":[],"conferir":"handle secundario ____amnh aparecia solto 3x na lista; confirmar se e dela"},
 {"ordem":4,"nome":"Naiara Alvin","uf":"BA","local":null,"handles":["ohnaiara","estudio.amaralina"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":5,"nome":"Kel Galdino","uf":"RJ","local":null,"handles":["arskelgaldino"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":6,"nome":"Pablo","uf":"MG","local":"Belo Horizonte","handles":["pabloenricos"],"ocupacao":null,"linkedin":"pablo-enrico","nao_linkar":[],"conferir":null},
 {"ordem":7,"nome":"Graziela Borges","uf":"BA","local":null,"handles":["mussssurana"],"ocupacao":null,"linkedin":"grazielaaborgess","nao_linkar":[],"conferir":null},
 {"ordem":8,"nome":"Felipe Araujo","uf":"PE","local":null,"handles":["feslipe.a","bailecharmerec"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":9,"nome":"Ana Carolina","uf":"SP","local":null,"handles":["ana.k0902"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":10,"nome":"Pamela Correa","uf":"RJ","local":"Campos dos Goytacazes","handles":["paamelacorrea","casaafroraiz"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":11,"nome":"Cristal","uf":"RJ","local":null,"handles":["cristalfayola"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":12,"nome":"Carol","uf":"SP","local":null,"handles":["carolinecomcee"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":13,"nome":"Sol","uf":"SP","local":null,"handles":["solange_zion_"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":14,"nome":"Tamiris Ciríaco","uf":"SP","local":"SP/MG","handles":["tamirisciriaco"],"ocupacao":null,"linkedin":"tamiris-ciriaco","nao_linkar":[],"conferir":null},
 {"ordem":15,"nome":"David","uf":"CE","local":null,"handles":["dwvid.silva"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":16,"nome":"Eduarda","uf":"RJ","local":null,"handles":["dudaohlavrac"],"ocupacao":null,"linkedin":"eduarda-lc-almeida","nao_linkar":[],"conferir":null},
 {"ordem":17,"nome":"Felipe Morais","uf":"SP","local":null,"handles":["femorais2"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":18,"nome":"Sandy Leah","uf":"PE","local":null,"handles":["sandyleahc"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":19,"nome":"Matheus Henrique","uf":"ES","local":"ES/SP","handles":["omatheushenriq"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":20,"nome":"Carol Cof","uf":"SP","local":null,"handles":["carol.cof"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":21,"nome":"Bia Tech","uf":"PR","local":null,"handles":["biatech","cabeluda_"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":"a lista trazia cabeluda_ e cabeluda__ ; confirmar qual e o certo"},
 {"ordem":22,"nome":"Gabriella","uf":"SP","local":null,"handles":["gabriellacoast_"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":23,"nome":"Vanessa","uf":"SP","local":null,"handles":["vanessabraziliensis"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":24,"nome":"Camiska","uf":"SP","local":null,"handles":["camiska"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":25,"nome":"Giovana","uf":"SP","local":null,"handles":["gisaniro"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":26,"nome":"Igor","uf":"PR","local":null,"handles":["bordignonigor","yvic.dsgn"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":27,"nome":"Julia Novais","uf":"ES","local":null,"handles":["julia.novais__"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":28,"nome":"Júnior","uf":"MG","local":null,"handles":["joseassisjunior"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":29,"nome":"Michele Medeiros","uf":"CE","local":null,"handles":["umadosedemichele"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":30,"nome":"Rodrigo Barreto","uf":"RJ","local":null,"handles":["robayamaguchi"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":31,"nome":"Bruno Buxexa","uf":null,"local":null,"handles":["bboybuxexa"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":32,"nome":"Sarah Chrispino","uf":"SP","local":"SP/RJ","handles":["sarahchrispino"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":33,"nome":"Malu Laino","uf":"RJ","local":null,"handles":["malu_laino"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":34,"nome":"Bianca Costa","uf":"SP","local":null,"handles":["bicosstaa"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":35,"nome":"Bárbara Danielly","uf":"SP","local":null,"handles":["barbara.felipini"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":36,"nome":"Anderson Ribeiro","uf":"SP","local":"Zona Leste","handles":["andergoa"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":37,"nome":"Mariana Silvestre","uf":"SP","local":null,"handles":["bloodmaari"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":38,"nome":"Thayana B. Fontes","uf":"RJ","local":null,"handles":["thayanatbf"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":39,"nome":"Ana Caroline","uf":"SP","local":"Zona Sul","handles":["anakca"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":40,"nome":"Alice Dantas","uf":"SP","local":null,"handles":["dantasalicec"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":41,"nome":"Emily","uf":"RJ","local":null,"handles":["emy_o.lima"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":42,"nome":"Millena Beatriz","uf":"SP","local":null,"handles":["ultralight_bea"],"ocupacao":"Disainhaelavem","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":43,"nome":"Thalia Peçanha","uf":"ES","local":null,"handles":["comthalia"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":44,"nome":"Alice","uf":null,"local":null,"handles":["alice_aais"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":45,"nome":"Yago Rodrigues","uf":"RS","local":null,"handles":["yagorodrigues323"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":46,"nome":"Babi Benicio","uf":"RJ","local":null,"handles":["babibenicio.oficial"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":47,"nome":"Nallu","uf":"SP","local":null,"handles":["nallu.a"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":48,"nome":"Gustavo Duarte","uf":"MG","local":"Belo Horizonte","handles":["gu.duartep"],"ocupacao":null,"linkedin":"gustavo-duarteps","nao_linkar":[],"conferir":null},
 {"ordem":49,"nome":"Alè","uf":"RJ","local":null,"handles":["ale.compositor"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":50,"nome":"Gabriel","uf":null,"local":null,"handles":["gabrielnazza_"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":51,"nome":"Andy","uf":"SP","local":null,"handles":["codinomeandy"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":52,"nome":"Ana Kelly","uf":"RJ","local":"interior","handles":["akambar__"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":53,"nome":"Laianne Bomfim","uf":"BA","local":"Recôncavo / Salvador","handles":["laiannebomfim"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":54,"nome":"Mary Ayra","uf":"AL","local":null,"handles":["mary_ayra"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":55,"nome":"Ulisses Passos","uf":"MG","local":"Belo Horizonte","handles":["ulissespassos"],"ocupacao":null,"linkedin":"ulissespassos","nao_linkar":[],"conferir":null},
 {"ordem":56,"nome":"Jéssica Erasmo","uf":"SP","local":null,"handles":["jessica.erasmo"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":57,"nome":"Tumbi Produz","uf":"SE","local":null,"handles":["tumbiproduz"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":58,"nome":"Etelvino Goes","uf":"BA","local":"Santo Amaro / Recôncavo","handles":["thellgoes"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":59,"nome":"Lari Dias","uf":"SP","local":null,"handles":["lari.diaas"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":60,"nome":"Nathan Bernardes Santos","uf":"SP","local":null,"handles":["__nbs00"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":61,"nome":"Eúna Tayná","uf":"PA","local":"Pará / RJ","handles":["mulherdonorteh"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":62,"nome":"Fauxtino","uf":"DF","local":null,"handles":["fauxtino.com.br"],"ocupacao":null,"linkedin":null,"nao_linkar":["fauxtino.com.br"],"conferir":"handle parece endereco de site; nao gerar link ate confirmar"},
 {"ordem":63,"nome":"Tone Araújo","uf":"PE","local":null,"handles":["araujotone"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":64,"nome":"Mariah Luiza","uf":"SP","local":null,"handles":["__mariahl"],"ocupacao":null,"linkedin":"mariah-luiza-dos-anjos-raymundo","nao_linkar":[],"conferir":null},
 {"ordem":65,"nome":"Breno Soares","uf":"SP","local":null,"handles":["xxbrenos"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":66,"nome":"Erick Reifanny","uf":"PE","local":null,"handles":[],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":"sem @ na lista de origem"},
 {"ordem":67,"nome":"Dani","uf":"SP","local":"SP/RJ","handles":["danielllezp"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":68,"nome":"Iara Ventura","uf":"SP","local":null,"handles":["el.a_ventura"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":69,"nome":"Maju Rodrigues","uf":"MG","local":"Belo Horizonte","handles":["maju_rdg"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":70,"nome":"Rafael Silva","uf":"SP","local":null,"handles":["rafitosilvaa"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":71,"nome":"Yago Mendes","uf":null,"local":null,"handles":["ngmpediu"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":72,"nome":"Letícia Gevigier","uf":"RJ","local":null,"handles":["jinjioka"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":73,"nome":"Beka Bezerra","uf":"CE","local":null,"handles":["beka.bezerra"],"ocupacao":null,"linkedin":"rebeca-bezerra-barbosa","nao_linkar":[],"conferir":null},
 {"ordem":74,"nome":"Gustavo Borges","uf":"BA","local":null,"handles":["borisokereke"],"ocupacao":"Produtor cultural","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":75,"nome":"Letícia Verônica","uf":"SP","local":null,"handles":["_averonica_"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":76,"nome":"Jessica Ferreira","uf":"SP","local":"Zona Sul","handles":["jessicafsilva22"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":77,"nome":"Laryssa Passos","uf":"RJ","local":null,"handles":["_laryssapas"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":78,"nome":"Gabriella Plácido","uf":"SP","local":null,"handles":["its.gabiss"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":79,"nome":"Karine de Souza","uf":"RJ","local":null,"handles":["karinedesouzza"],"ocupacao":null,"linkedin":"karinedesouzza","nao_linkar":[],"conferir":null},
 {"ordem":80,"nome":"Dayara Nunes","uf":"SP","local":null,"handles":["dayaranunnes"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":81,"nome":"Emily Borges","uf":"PR","local":null,"handles":["beges98_"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":82,"nome":"Carolina Ramos","uf":"RJ","local":null,"handles":[],"ocupacao":null,"linkedin":"carolinaramosrp","nao_linkar":[],"conferir":"na origem, o @jahiamani aparecia nesta linha e tambem em Jahi Amani; confirmar de quem e"},
 {"ordem":83,"nome":"Dani Pereira","uf":"SP","local":null,"handles":["pacoteaberto","quebradafenix"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":84,"nome":"Nayara Aguiar","uf":"MG","local":"Belo Horizonte","handles":["shelfishbeach"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":85,"nome":"Marisa Tavares","uf":"SP","local":null,"handles":["maris4tds"],"ocupacao":null,"linkedin":"marisa-t","nao_linkar":[],"conferir":null},
 {"ordem":86,"nome":"Roxedo","uf":"MA","local":"São Luís","handles":["roxedoo"],"ocupacao":null,"linkedin":"hairton-rocha","nao_linkar":[],"conferir":null},
 {"ordem":87,"nome":"Kawany Feliciano","uf":"SP","local":null,"handles":["kawany_feliciano"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":"e voce: decidir se sai da lista ou nasce ja reivindicado"},
 {"ordem":88,"nome":"Vinicius Nonato","uf":"SP","local":null,"handles":["vinicius.nonato"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":89,"nome":"Rodolpho Cezar","uf":"RJ","local":null,"handles":["cezardolphino"],"ocupacao":null,"linkedin":"rodolphocezar","nao_linkar":[],"conferir":null},
 {"ordem":90,"nome":"Ana Amorim","uf":"SP","local":null,"handles":["ana_____af"],"ocupacao":null,"linkedin":"ana-amorim-fontana","nao_linkar":[],"conferir":null},
 {"ordem":91,"nome":"Julia Bragança Cavalcante","uf":"SP","local":"São Paulo / Buenos Aires","handles":["ju_bra_ca"],"ocupacao":null,"linkedin":"julia-braganca-cavalcante","nao_linkar":[],"conferir":null},
 {"ordem":92,"nome":"Maria Feitosa","uf":"RJ","local":null,"handles":["mariafeitosarte"],"ocupacao":null,"linkedin":"mariafeitosarte","nao_linkar":[],"conferir":null},
 {"ordem":93,"nome":"Mateus Freitas","uf":null,"local":null,"handles":["freitasde_"],"ocupacao":null,"linkedin":"mateus-freitas","nao_linkar":[],"conferir":null},
 {"ordem":94,"nome":"Carol Martins","uf":"PR","local":null,"handles":["carolicam"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":95,"nome":"Inah","uf":"MG","local":"Belo Horizonte","handles":["inainamojubaa","perspectivasnegraspod","uanji_branding"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":96,"nome":"Francineide Bandeira","uf":"SP","local":"Capão Redondo","handles":["francesismo"],"ocupacao":null,"linkedin":"francineidbandeira","nao_linkar":[],"conferir":null},
 {"ordem":97,"nome":"Vicky Xavier","uf":"SP","local":null,"handles":["arvickvi"],"ocupacao":null,"linkedin":"aryene-xavier","nao_linkar":[],"conferir":null},
 {"ordem":98,"nome":"Rogério Almeida","uf":"SP","local":"Jundiaí","handles":["rogerio1.fenix"],"ocupacao":null,"linkedin":"rogerio-almeida","nao_linkar":[],"conferir":null},
 {"ordem":99,"nome":"Raffaella Conceição","uf":"ES","local":null,"handles":["raffaellaconceicao","manifestacaocriativa"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":100,"nome":"Gustavo Costa","uf":"SP","local":null,"handles":["gutcosta"],"ocupacao":null,"linkedin":"ogucosta","nao_linkar":[],"conferir":null},
 {"ordem":101,"nome":"João de Paulo","uf":"PR","local":"Curitiba","handles":["jaode_paulo"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":102,"nome":"Lucas Lustosa","uf":"GO","local":"Goiânia","handles":["lucaslustosab"],"ocupacao":null,"linkedin":"lucas-lustosa","nao_linkar":[],"conferir":null},
 {"ordem":103,"nome":"Ibis Lima","uf":"RJ","local":null,"handles":["ibislima"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":104,"nome":"Beatriz Leopoldino","uf":"RJ","local":null,"handles":["leopoldinobiaa"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":105,"nome":"Adriana Tere","uf":"RJ","local":"RJ / PA","handles":["adrianatere_"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":106,"nome":"Maria Clara","uf":"BA","local":null,"handles":["mariasimoez","mariasimoesportf"],"ocupacao":null,"linkedin":"mariaclaragomessimoes","nao_linkar":[],"conferir":null},
 {"ordem":107,"nome":"Carol Borges","uf":"SP","local":"SP / BH","handles":["carolinde_"],"ocupacao":null,"linkedin":"carolinamelo","nao_linkar":[],"conferir":null},
 {"ordem":108,"nome":"Alexia Santos","uf":"BA","local":"Bahia / Colômbia","handles":["diaskalexia","alexsant___"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":109,"nome":"Grazz Silva","uf":null,"local":null,"handles":["grazzielu"],"ocupacao":null,"linkedin":"grazzsilva","nao_linkar":[],"conferir":null},
 {"ordem":110,"nome":"Ana Beatriz","uf":"SP","local":null,"handles":["abmartiiins"],"ocupacao":null,"linkedin":"ana-beatriz-international-trade","nao_linkar":[],"conferir":null},
 {"ordem":111,"nome":"Joyce Amaro","uf":"SP","local":null,"handles":["amarujoy"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":112,"nome":"Jahi Amani","uf":"MG","local":"BH / RJ","handles":["jahiamani"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":113,"nome":"Maria Eduarda Prado","uf":"SC","local":"Florianópolis","handles":["mariaeduardafotos","m.aprado"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":114,"nome":"Norma Lourenço","uf":"RJ","local":null,"handles":["normadyn"],"ocupacao":null,"linkedin":"normalourenco","nao_linkar":[],"conferir":null},
 {"ordem":115,"nome":"William Montero","uf":"SP","local":null,"handles":["dsbmontero"],"ocupacao":null,"linkedin":"ignaciowilliam","nao_linkar":[],"conferir":null},
 {"ordem":116,"nome":"Juliana Neris","uf":"RJ","local":null,"handles":["nerisrjuliana"],"ocupacao":"Jornalista e produtora cultural","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":117,"nome":null,"uf":"RJ","local":null,"handles":["hubcomunicria"],"ocupacao":"Produtora audiovisual","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":118,"nome":"Rebecca","uf":"PE","local":null,"handles":["ataldabecca_"],"ocupacao":"Produtora","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":119,"nome":"Gustavo Barros","uf":"CE","local":null,"handles":["gustavobbarros_"],"ocupacao":"Produtor","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":120,"nome":null,"uf":null,"local":null,"handles":["alma.mundi_"],"ocupacao":"Produtora","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":121,"nome":"Vitória Greice","uf":null,"local":null,"handles":["vitoriagreice","vg.criativa"],"ocupacao":"Produtora e head manager","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":122,"nome":null,"uf":"RJ","local":null,"handles":["gislaneart"],"ocupacao":"Artista, arte-educadora e curadora","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":123,"nome":"Edson Leite","uf":"RR","local":null,"handles":["embuaprodutora"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":124,"nome":"Fany Miranda","uf":"PB","local":null,"handles":["fanymirandaoficial","kaosproducao"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":125,"nome":"Vini Martins","uf":"RJ","local":"RJ / ES","handles":["vinimartins.arq"],"ocupacao":"Arquiteto, produtor cultural e curador periférico","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":126,"nome":"Micah Aguiar","uf":null,"local":null,"handles":["micahaguiars"],"ocupacao":"Produtora cultural, audiovisual e relações públicas","linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":127,"nome":"Chris","uf":"SP","local":null,"handles":["christiano_gonzaga"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":128,"nome":null,"uf":"BA","local":null,"handles":["joaoguaragna"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":129,"nome":null,"uf":"SP","local":null,"handles":["miguels.adv"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":130,"nome":"Allmeyda","uf":"RJ","local":null,"handles":["_allmeyda"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":131,"nome":"Akin Kremer","uf":"RS","local":null,"handles":["akin.atroz"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":132,"nome":"Sil Lucas","uf":"SC","local":null,"handles":["badgalsiil"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":133,"nome":null,"uf":"PI","local":"Parnaíba","handles":["acidezzz_artes"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":134,"nome":"Pabllo","uf":"BA","local":null,"handles":["pabllozzz"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":135,"nome":"Regina Reid","uf":"SP","local":null,"handles":["iamreginamilan"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":136,"nome":"Eduarda Penante","uf":"SP","local":null,"handles":["dudaapenante"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":137,"nome":"Rayza Caldas","uf":"RJ","local":null,"handles":["rayzacaldas"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":138,"nome":"Gia Quirino","uf":"RJ","local":null,"handles":["gia.quirino"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null},
 {"ordem":139,"nome":"Raisa Andrade","uf":"PE","local":null,"handles":["verdemel_"],"ocupacao":null,"linkedin":null,"nao_linkar":[],"conferir":null}
]$redes$::jsonb) as r(
  ordem int, nome text, uf text, "local" text, handles text[],
  ocupacao text, linkedin text, nao_linkar text[], conferir text
);

-- ----------------------------------------------------------------------- RLS

alter table perfis_suspensos enable row level security;

-- O `revoke` não é decoração: o Supabase já concede tudo em toda tabela nova
-- de `public` para `anon` e `authenticated`. Sem tirar primeiro, a permissão
-- por coluna abaixo não restringiria coisa nenhuma.
revoke all on perfis_suspensos from anon, authenticated;
grant select on perfis_suspensos to anon, authenticated;
grant update (reivindicado_por) on perfis_suspensos to authenticated;

-- Quem pediu pra sair some daqui pra frente, pra todo mundo, sem exceção.
create policy suspensos_leitura on perfis_suspensos
  for select to anon, authenticated using (removido = false);

-- Logado mexe em registro sem dono ou no próprio: reivindica ("sou eu") ou
-- devolve ("não era eu"). O `using` é o que impede tomar o @ de outra pessoa,
-- e a permissão por coluna impede reescrever nome e handle.
create policy suspensos_reivindicacao on perfis_suspensos
  for update to authenticated
  using (removido = false
         and (reivindicado_por is null or reivindicado_por = auth.uid()))
  with check (reivindicado_por is null or reivindicado_por = auth.uid());

-- ------------------------------------------------------- sair da lista
--
-- Quem está na lista, por definição, ainda não tem conta aqui: exigir login
-- pra sair seria exigir entrar pra poder sair. Mas marcar `removido` por
-- UPDATE direto não funciona, e não é detalhe de gosto: o Postgres exige que a
-- linha DEPOIS do update continue visível pela política de SELECT, e a política
-- acima esconde justamente o que foi removido. Ou a lista some de verdade, ou o
-- update passa — não os dois.
--
-- Daí esta função. Ela roda com os poderes de quem a criou (`security
-- definer`), então não esbarra na própria política, e é a ÚNICA porta que
-- escreve `removido`: `anon` não tem permissão de update em coluna nenhuma.
-- Uma porta só, de uma folha só — marca a saída e não faz mais nada.

create function sair_da_lista(p_handle text) returns boolean
  language plpgsql security definer set search_path = public as $fn$
declare
  alvo text := regexp_replace(lower(btrim(p_handle)), '^@+', '');
  achou int;
begin
  if alvo = '' then return false; end if;
  update perfis_suspensos
     set removido = true
   where removido = false and alvo = any (handles);
  get diagnostics achou = row_count;
  return achou > 0;
end;
$fn$;

-- Sem o revoke, toda função nasce executável por qualquer um.
revoke all on function sair_da_lista(text) from public;
grant execute on function sair_da_lista(text) to anon, authenticated;
