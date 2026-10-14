import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { NavBarComponent } from '../LandingPage/NavBar/NavBar.component';

type GuideLanguage = 'fr' | 'en';
type GuideRole = 'manager' | 'owner';

interface GuideItem {
  icon: string;
  title: string;
  description: string;
}

interface WorkflowItem {
  icon: string;
  title: string;
  description: string;
  steps: string[];
  result: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface GuideContent {
  pageTitle: string;
  kicker: string;
  title: string;
  intro: string;
  startButton: string;
  videoButton: string;
  guideLink: string;
  guideLinkHint: string;
  guideAction: string;
  quickTitle: string;
  quickIntro: string;
  quickItems: GuideItem[];
  screenshotEyebrow: string;
  screenshotTitle: string;
  screenshotDescription: string;
  screenshots: Array<{ title: string; description: string; alt: string }>;
  videosEyebrow: string;
  videosTitle: string;
  videosIntro: string;
  videoPlayLabel: string;
  videos: Array<{ title: string; description: string; duration: string }>;
  journeysEyebrow: string;
  journeysTitle: string;
  journeysIntro: string;
  managerLabel: string;
  managerDescription: string;
  ownerLabel: string;
  ownerDescription: string;
  workflows: Record<GuideRole, WorkflowItem[]>;
  expectedResult: string;
  practicesTitle: string;
  practices: string[];
  helpEyebrow: string;
  helpTitle: string;
  helpIntro: string;
  troubleshooting: GuideItem[];
  faqTitle: string;
  faqs: FaqItem[];
  ctaTitle: string;
  ctaText: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

const GUIDE_CONTENT: Record<GuideLanguage, GuideContent> = {
  fr: {
    pageTitle: 'Documentation MYB | Guide utilisateur',
    kicker: "Centre d'aide MYB",
    title: 'Prenez MYB en main, simplement.',
    intro:
      'Un guide visuel pour comprendre votre espace, retrouver les actions essentielles et avancer en toute confiance — que vous soyez syndic ou propriétaire.',
    startButton: 'Démarrage rapide',
    videoButton: 'Voir les tutoriels',
    guideLink: 'Guide complet intégré',
    guideLinkHint: 'Toutes les étapes utiles sont disponibles ici, sans quitter MYB.',
    guideAction: 'Explorer les parcours',
    quickTitle: 'Vos premiers pas en 3 minutes',
    quickIntro: 'Le bon contexte, le bon espace, puis vos actions prioritaires.',
    quickItems: [
      {
        icon: 'bi-box-arrow-in-right',
        title: '1. Connectez-vous',
        description: 'Utilisez vos identifiants MYB. Votre espace principal s’ouvre selon votre rôle.',
      },
      {
        icon: 'bi-buildings',
        title: '2. Choisissez la copropriété',
        description: 'Vérifiez toujours la copropriété active avant une action financière ou une modification.',
      },
      {
        icon: 'bi-compass',
        title: '3. Suivez votre tableau de bord',
        description: 'Les indicateurs et badges vous montrent les éléments à traiter en priorité.',
      },
    ],
    screenshotEyebrow: 'Guides visuels',
    screenshotTitle: 'Comprendre le parcours en un coup d’œil',
    screenshotDescription:
      'Ces captures issues des tutoriels présentent les situations que MYB aide à simplifier avant de passer aux étapes pratiques.',
    screenshots: [
      {
        title: 'Centraliser les documents',
        description: 'Remplacez les dossiers dispersés par un espace clair, organisé et accessible.',
        alt: 'Gestionnaire consultant plusieurs documents papier avant leur centralisation dans MYB',
      },
      {
        title: 'Passer au suivi numérique',
        description: 'Retrouvez les informations essentielles au même endroit et suivez-les depuis votre espace.',
        alt: 'Transition visuelle vers une gestion numérique centralisée avec MYB',
      },
    ],
    videosEyebrow: 'Tutoriels vidéo',
    videosTitle: 'Découvrez MYB en images',
    videosIntro:
      'Deux séquences courtes pour comprendre la promesse de MYB et découvrir l’expérience proposée.',
    videoPlayLabel: 'Lire la vidéo',
    videos: [
      {
        title: 'Pourquoi MYB ?',
        description: 'Une introduction rapide aux défis quotidiens que MYB aide à simplifier.',
        duration: 'Séquence 01',
      },
      {
        title: 'L’expérience MYB',
        description: 'Découvrez une gestion plus claire, centralisée et accessible à chaque profil.',
        duration: 'Séquence 02',
      },
    ],
    journeysEyebrow: 'Guides par profil',
    journeysTitle: 'Suivez le parcours qui vous correspond',
    journeysIntro: 'Chaque espace affiche uniquement les outils utiles à votre rôle et à vos autorisations.',
    managerLabel: 'Je suis syndic',
    managerDescription: 'Administration, lots, finances et suivi opérationnel',
    ownerLabel: 'Je suis propriétaire',
    ownerDescription: 'Lots, factures, charges et demandes',
    workflows: {
      manager: [
        {
          icon: 'bi-speedometer2',
          title: 'Piloter depuis le tableau de bord',
          description: 'Obtenez une vue immédiate des budgets, lots, propriétaires et paiements.',
          steps: ['Ouvrez Tableau de bord.', 'Consultez les indicateurs clés.', 'Ouvrez les sections signalées comme prioritaires.'],
          result: 'Vous identifiez rapidement les actions urgentes de la journée.',
        },
        {
          icon: 'bi-wallet2',
          title: 'Gérer budgets et appels de fonds',
          description: 'Préparez les besoins financiers et contrôlez leur répartition.',
          steps: ['Ouvrez Budgets et allocation.', 'Vérifiez montant, échéance et statut.', 'Contrôlez la répartition avant publication.'],
          result: 'Les appels de fonds sont clairs et prêts à être suivis.',
        },
        {
          icon: 'bi-building',
          title: 'Tenir les lots à jour',
          description: 'Centralisez les informations utiles de chaque bien.',
          steps: ['Ouvrez Lots.', 'Ajoutez ou modifiez un lot.', 'Vérifiez numéro, surface et statut.'],
          result: 'Les données des lots peuvent être utilisées de façon fiable dans les autres modules.',
        },
        {
          icon: 'bi-people',
          title: 'Associer propriétaires et occupants',
          description: 'Maintenez des rattachements cohérents entre personnes et lots.',
          steps: ['Ouvrez Propriétaires ou Locataires.', 'Mettez la fiche à jour.', 'Contrôlez l’association au bon lot.'],
          result: 'Chaque lot est relié aux bonnes personnes.',
        },
        {
          icon: 'bi-credit-card',
          title: 'Suivre les paiements',
          description: 'Repérez les règlements, les montants à valider et les impayés.',
          steps: ['Ouvrez Paiements de charges.', 'Filtrez par statut ou période.', 'Vérifiez le détail avant validation.'],
          result: 'Vous disposez d’une vision nette des montants réglés et restant dus.',
        },
        {
          icon: 'bi-exclamation-diamond',
          title: 'Traiter les signalements',
          description: 'Classez les incidents et gardez leur suivi visible.',
          steps: ['Ouvrez Signalements.', 'Priorisez selon l’urgence.', 'Mettez à jour le statut et la prochaine action.'],
          result: 'Chaque demande conserve un suivi clair.',
        },
      ],
      owner: [
        {
          icon: 'bi-speedometer2',
          title: 'Lire votre tableau de bord',
          description: 'Voyez tout de suite ce qui demande votre attention.',
          steps: ['Ouvrez Tableau de bord.', 'Consultez vos factures en attente.', 'Accédez directement à la rubrique concernée.'],
          result: 'Vos priorités sont visibles en un coup d’œil.',
        },
        {
          icon: 'bi-house-door',
          title: 'Vérifier vos lots',
          description: 'Retrouvez les biens rattachés à votre compte.',
          steps: ['Ouvrez Mes lots.', 'Consultez la liste et les informations.', 'Ouvrez un lot pour afficher son détail.'],
          result: 'Vous confirmez que vos biens sont correctement associés.',
        },
        {
          icon: 'bi-geo-alt',
          title: 'Changer de résidence',
          description: 'Travaillez toujours dans le bon contexte de copropriété.',
          steps: ['Ouvrez Résidence.', 'Vérifiez la copropriété active.', 'Changez de copropriété si nécessaire.'],
          result: 'Toutes les informations affichées correspondent à la résidence choisie.',
        },
        {
          icon: 'bi-receipt',
          title: 'Consulter et régler une facture',
          description: 'Suivez les montants, échéances et statuts de paiement.',
          steps: ['Ouvrez Factures.', 'Filtrez par état ou période.', 'Ouvrez le détail puis lancez le paiement disponible.'],
          result: 'La facture est traitée et son statut peut être suivi.',
        },
        {
          icon: 'bi-pie-chart',
          title: 'Comprendre vos charges',
          description: 'Consultez la répartition et rapprochez-la de vos factures.',
          steps: ['Ouvrez Charges.', 'Lisez les montants et postes associés.', 'Comparez-les avec vos factures.'],
          result: 'Les montants facturés deviennent compréhensibles et traçables.',
        },
        {
          icon: 'bi-chat-left-text',
          title: 'Créer un signalement',
          description: 'Déclarez un problème et suivez son avancement.',
          steps: ['Ouvrez Signalements.', 'Créez une demande.', 'Décrivez le problème, sa zone et sa priorité.'],
          result: 'Votre demande est enregistrée et son statut reste consultable.',
        },
      ],
    },
    expectedResult: 'Résultat attendu',
    practicesTitle: 'Les 3 réflexes à garder',
    practices: [
      'Confirmez la copropriété active avant un paiement ou une modification.',
      'Utilisez les badges et statuts pour prioriser vos actions.',
      'Relisez les informations d’un formulaire avant de l’enregistrer.',
    ],
    helpEyebrow: 'Besoin d’aide ?',
    helpTitle: 'Résoudre les blocages courants',
    helpIntro: 'Ces vérifications simples règlent la plupart des difficultés de navigation.',
    troubleshooting: [
      {
        icon: 'bi-layout-sidebar',
        title: 'Menu incomplet',
        description: 'Vérifiez votre rôle actif, changez d’espace si disponible, puis reconnectez-vous.',
      },
      {
        icon: 'bi-building-x',
        title: 'Copropriété absente',
        description: 'Ouvrez le sélecteur. Si elle reste absente, demandez à votre administrateur de vérifier votre rattachement.',
      },
      {
        icon: 'bi-arrow-clockwise',
        title: 'Facture non mise à jour',
        description: 'Actualisez la page, rouvrez la facture et confirmez que la bonne copropriété est active.',
      },
      {
        icon: 'bi-lock',
        title: 'Action non autorisée',
        description: 'La fonction peut dépendre de votre rôle ou être en disponibilité limitée. Contactez votre support interne.',
      },
    ],
    faqTitle: 'Questions fréquentes',
    faqs: [
      {
        question: 'Je suis syndic et propriétaire. Comment changer d’espace ?',
        answer: 'Utilisez l’action de changement d’espace dans votre menu utilisateur ou dans la navigation latérale.',
      },
      {
        question: 'Pourquoi certaines rubriques ne sont-elles pas visibles ?',
        answer: 'La visibilité dépend de votre rôle, de vos autorisations et des fonctions activées dans votre environnement.',
      },
      {
        question: 'Comment confirmer que je suis dans la bonne copropriété ?',
        answer: 'Vérifiez le nom de la copropriété active affiché dans l’en-tête avant toute action sensible.',
      },
      {
        question: 'Une facture reste en attente après mon paiement. Que faire ?',
        answer: 'Actualisez la page et consultez l’historique. Certains paiements nécessitent une validation du syndic avant la mise à jour du statut.',
      },
    ],
    ctaTitle: 'Prêt à gérer plus simplement ?',
    ctaText: 'Connectez-vous à votre espace ou créez votre compte pour commencer.',
    ctaPrimary: 'Commencer',
    ctaSecondary: 'Revoir le démarrage rapide',
  },
  en: {
    pageTitle: 'MYB Documentation | User guide',
    kicker: 'MYB Help Center',
    title: 'Get comfortable with MYB, quickly.',
    intro:
      'A visual guide to understand your workspace, find essential actions, and move forward confidently—whether you are a property manager or an owner.',
    startButton: 'Quick start',
    videoButton: 'Watch tutorials',
    guideLink: 'Complete built-in guide',
    guideLinkHint: 'Every useful step is available here without leaving MYB.',
    guideAction: 'Explore role guides',
    quickTitle: 'Your first steps in 3 minutes',
    quickIntro: 'The right context, the right space, then your priority actions.',
    quickItems: [
      {
        icon: 'bi-box-arrow-in-right',
        title: '1. Sign in',
        description: 'Use your MYB credentials. Your main workspace opens according to your role.',
      },
      {
        icon: 'bi-buildings',
        title: '2. Choose the coproperty',
        description: 'Always verify the active coproperty before a financial action or an update.',
      },
      {
        icon: 'bi-compass',
        title: '3. Follow your dashboard',
        description: 'Indicators and badges show the items that need your attention first.',
      },
    ],
    screenshotEyebrow: 'Visual guides',
    screenshotTitle: 'Understand the journey at a glance',
    screenshotDescription:
      'These tutorial stills introduce the situations MYB helps simplify before you move on to the practical steps.',
    screenshots: [
      {
        title: 'Centralize your documents',
        description: 'Replace scattered paperwork with one clear, organized and accessible workspace.',
        alt: 'Manager reviewing several paper documents before centralizing them in MYB',
      },
      {
        title: 'Move to digital tracking',
        description: 'Find essential information in one place and follow it from your workspace.',
        alt: 'Visual transition toward centralized digital management with MYB',
      },
    ],
    videosEyebrow: 'Video tutorials',
    videosTitle: 'Discover MYB in action',
    videosIntro: 'Two short sequences explain the MYB promise and introduce the experience.',
    videoPlayLabel: 'Play video',
    videos: [
      {
        title: 'Why MYB?',
        description: 'A quick introduction to the everyday challenges MYB helps simplify.',
        duration: 'Sequence 01',
      },
      {
        title: 'The MYB experience',
        description: 'Discover clearer, centralized management designed for every profile.',
        duration: 'Sequence 02',
      },
    ],
    journeysEyebrow: 'Role-based guides',
    journeysTitle: 'Follow the journey that matches your role',
    journeysIntro: 'Each workspace only shows the tools available to your role and permissions.',
    managerLabel: 'I am a property manager',
    managerDescription: 'Administration, units, finances, and operations',
    ownerLabel: 'I am an owner',
    ownerDescription: 'Units, invoices, charges, and requests',
    workflows: {
      manager: [
        {
          icon: 'bi-speedometer2',
          title: 'Run operations from the dashboard',
          description: 'Get an immediate view of budgets, units, owners, and payments.',
          steps: ['Open Dashboard.', 'Review key indicators.', 'Open the sections marked as a priority.'],
          result: 'You quickly identify the urgent actions for the day.',
        },
        {
          icon: 'bi-wallet2',
          title: 'Manage budgets and fund calls',
          description: 'Prepare financial needs and validate their allocation.',
          steps: ['Open Budgets and allocation.', 'Check amount, due date, and status.', 'Review allocation before publication.'],
          result: 'Fund calls are clear and ready to be monitored.',
        },
        {
          icon: 'bi-building',
          title: 'Keep unit records accurate',
          description: 'Centralize the useful information for every property unit.',
          steps: ['Open Units.', 'Add or update a unit.', 'Verify number, area, and status.'],
          result: 'Unit data can be used reliably throughout MYB.',
        },
        {
          icon: 'bi-people',
          title: 'Map owners and occupants',
          description: 'Maintain consistent relationships between people and units.',
          steps: ['Open Owners or Tenants.', 'Update the record.', 'Confirm the association with the correct unit.'],
          result: 'Every unit is linked to the right people.',
        },
        {
          icon: 'bi-credit-card',
          title: 'Track payments',
          description: 'See received payments, items to validate, and outstanding balances.',
          steps: ['Open Charge payments.', 'Filter by status or period.', 'Review details before validation.'],
          result: 'You have a clear view of paid and outstanding amounts.',
        },
        {
          icon: 'bi-exclamation-diamond',
          title: 'Handle reports',
          description: 'Prioritize incidents and keep their progress visible.',
          steps: ['Open Reports.', 'Prioritize by urgency.', 'Update the status and next action.'],
          result: 'Every request has a clear follow-up trail.',
        },
      ],
      owner: [
        {
          icon: 'bi-speedometer2',
          title: 'Read your dashboard',
          description: 'Immediately see what needs your attention.',
          steps: ['Open Dashboard.', 'Review pending invoices.', 'Open the relevant section directly.'],
          result: 'Your priorities are clear at a glance.',
        },
        {
          icon: 'bi-house-door',
          title: 'Check your units',
          description: 'Find the properties connected to your account.',
          steps: ['Open My units.', 'Review the list and information.', 'Open a unit to see its details.'],
          result: 'You confirm that your properties are mapped correctly.',
        },
        {
          icon: 'bi-geo-alt',
          title: 'Switch residence',
          description: 'Always work within the correct coproperty context.',
          steps: ['Open Residence.', 'Check the active coproperty.', 'Switch coproperty when needed.'],
          result: 'All displayed information matches the selected residence.',
        },
        {
          icon: 'bi-receipt',
          title: 'Review and pay an invoice',
          description: 'Track amounts, due dates, and payment status.',
          steps: ['Open Invoices.', 'Filter by status or period.', 'Open details, then start the available payment action.'],
          result: 'The invoice is processed and its status can be tracked.',
        },
        {
          icon: 'bi-pie-chart',
          title: 'Understand your charges',
          description: 'Review the allocation and compare it with your invoices.',
          steps: ['Open Charges.', 'Review amounts and categories.', 'Compare them with your invoices.'],
          result: 'Billed amounts become understandable and traceable.',
        },
        {
          icon: 'bi-chat-left-text',
          title: 'Create a report',
          description: 'Declare an issue and follow its progress.',
          steps: ['Open Reports.', 'Create a request.', 'Describe the issue, location, and priority.'],
          result: 'Your request is recorded and its status remains available.',
        },
      ],
    },
    expectedResult: 'Expected result',
    practicesTitle: '3 habits to keep',
    practices: [
      'Confirm the active coproperty before a payment or update.',
      'Use badges and statuses to prioritize your work.',
      'Review form information before saving it.',
    ],
    helpEyebrow: 'Need help?',
    helpTitle: 'Resolve common blockers',
    helpIntro: 'These quick checks solve most navigation and access issues.',
    troubleshooting: [
      {
        icon: 'bi-layout-sidebar',
        title: 'Missing menu items',
        description: 'Check your active role, switch workspace if available, then sign in again.',
      },
      {
        icon: 'bi-building-x',
        title: 'Missing coproperty',
        description: 'Open the selector. If it is still missing, ask your administrator to verify your assignment.',
      },
      {
        icon: 'bi-arrow-clockwise',
        title: 'Invoice not updated',
        description: 'Refresh the page, reopen the invoice, and confirm the correct coproperty is active.',
      },
      {
        icon: 'bi-lock',
        title: 'Action not allowed',
        description: 'The feature may depend on your role or have limited availability. Contact internal support.',
      },
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        question: 'I am both a manager and an owner. How do I switch workspaces?',
        answer: 'Use the workspace switch action in your user menu or side navigation.',
      },
      {
        question: 'Why are some sections not visible?',
        answer: 'Visibility depends on your role, permissions, and the features enabled in your environment.',
      },
      {
        question: 'How do I confirm I am in the right coproperty?',
        answer: 'Check the active coproperty name in the header before any sensitive action.',
      },
      {
        question: 'My invoice is still pending after payment. What should I do?',
        answer: 'Refresh the page and check its history. Some payments require manager approval before the status changes.',
      },
    ],
    ctaTitle: 'Ready for simpler management?',
    ctaText: 'Sign in to your workspace or create an account to get started.',
    ctaPrimary: 'Get started',
    ctaSecondary: 'Review the quick start',
  },
};

@Component({
  selector: 'myb-front-docs-page',
  standalone: true,
  imports: [CommonModule, RouterModule, NavBarComponent],
  templateUrl: './docs-page.component.html',
  styleUrl: './docs-page.component.css',
})
export class DocsPageComponent implements OnInit, OnDestroy {
  readonly screenshotSources = [
    '/assets/docs/myb-documents-overview.png',
    '/assets/docs/myb-digital-transition.png',
  ];
  readonly videoSources = [
    '/assets/docs/myb-s01-hook.mp4',
    '/assets/docs/myb-s02-reveal.mp4',
  ];
  activeRole: GuideRole = 'manager';
  language: GuideLanguage = 'fr';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly translate: TranslateService,
    private readonly title: Title,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  get content(): GuideContent {
    return GUIDE_CONTENT[this.language];
  }

  get activeWorkflows(): WorkflowItem[] {
    return this.content.workflows[this.activeRole];
  }

  ngOnInit(): void {
    this.setLanguage(this.translate.currentLang || this.translate.defaultLang);
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ lang }) => this.setLanguage(lang));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectRole(role: GuideRole): void {
    this.activeRole = role;
  }

  scrollTo(sectionId: string): void {
    this.document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  trackByTitle(_index: number, item: { title: string }): string {
    return item.title;
  }

  private setLanguage(language: string | undefined): void {
    this.language = language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
    this.title.setTitle(this.content.pageTitle);
  }
}
