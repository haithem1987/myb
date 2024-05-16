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
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'myb-front-edit-project',
  standalone: true,
  imports: [CommonModule, BrowserModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './edit-project.component.html',
  styleUrl: './edit-project.component.css',
})
export class EditProjectComponent implements OnInit {
  projectForm: FormGroup;
  projectId?: number;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {
    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.projectId = +id;
        this.isEditMode = true;
        this.loadProject(this.projectId);
      }
    });
  }

  loadProject(id: number): void {
    this.projectService.get(id).subscribe((project) => {
      this.projectForm.patchValue(project);
    });
  }

  saveProject(): void {
    if (this.projectForm.valid) {
      const project: Project = this.projectForm.value;
      if (this.isEditMode && this.projectId) {
        this.projectService.update(this.projectId, project).subscribe(() => {
          this.router.navigate(['/projects']);
        });
      } else {
        this.projectService.create(project).subscribe(() => {
          this.router.navigate(['/projects']);
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}
