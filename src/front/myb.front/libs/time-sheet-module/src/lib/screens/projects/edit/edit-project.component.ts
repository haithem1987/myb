import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../models/project.model';
import { HttpClientModule } from '@angular/common/http';
import { CardComponent, DateUtilsService } from 'libs/shared/shared-ui/src';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'libs/shared/shared-ui/src/lib/services/toast.service';

@Component({
  selector: 'myb-front-edit-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    CardComponent,
    NgbDatepickerModule,
  ],
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css'],
})
export class EditProjectComponent implements OnInit {
  projectForm: FormGroup;
  projectId?: number;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private dateUtils: DateUtilsService,
    private toastService: ToastService
  ) {
    this.projectForm = this.fb.group({
      id: [null],
      projectName: ['', Validators.required],
      description: [''],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      userId: ['1', Validators.required],
      createdAt: [null],
      updatedAt: [null],
    });
  }

  ngOnInit(): void {
    const projectState = history.state.project as Project;
    console.log('projectState', projectState);
    if (projectState) {
      this.isEditMode = true;
      this.projectId = projectState.id;
      this.projectForm.patchValue(
        this.convertProjectToFormValues(projectState)
      );
    } else {
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.projectId = +id;
          this.isEditMode = true;
          this.loadProject(this.projectId);
        }
      });
    }
  }

  loadProject(id: number): void {
    this.projectService.get(id).subscribe((project) => {
      this.projectForm.patchValue(this.convertProjectToFormValues(project));
    });
  }

  saveProject(): void {
    if (this.projectForm.valid) {
      const project = this.convertFormValuesToProject();
      console.log('project', project);
      if (this.isEditMode && this.projectId) {
        this.projectService.update(this.projectId, project).subscribe(() => {
          this.toastService.show('Project updated successfully!', {
            classname: 'bg-success text-light',
          });
          this.router.navigate(['/timesheet/projects']);
        });
      } else {
        console.log('project', project);
        this.projectService.create(project).subscribe(() => {
          this.toastService.show('Project created successfully!', {
            classname: 'bg-success text-light',
          });
          this.router.navigate(['/timesheet/projects']);
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/timesheet/projects']);
  }

  private convertProjectToFormValues(project: Project): any {
    return {
      ...project,
      startDate: project.startDate
        ? this.dateUtils.toDateStruct(new Date(project.startDate))
        : null,
      endDate: project.endDate
        ? this.dateUtils.toDateStruct(new Date(project.endDate))
        : null,
    };
  }

  private convertFormValuesToProject(): Project {
    const formValues = this.projectForm.value;
    return {
      ...formValues,
      startDate: formValues.startDate
        ? this.dateUtils.fromDateStruct(formValues.startDate)
        : null,
      endDate: formValues.endDate
        ? this.dateUtils.fromDateStruct(formValues.endDate)
        : null,
    } as Project;
  }
}
