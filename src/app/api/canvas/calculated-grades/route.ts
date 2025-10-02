// app/api/canvas/calculated-grades/route.ts
// Replace the entire file with this fixed version:

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { canvasUrl, canvasApiKey } = await request.json();
    
    if (!canvasUrl || !canvasApiKey) {
      return NextResponse.json(
        { error: 'Canvas URL and API key are required' },
        { status: 400 }
      );
    }

    let apiUrl = canvasUrl.trim();
    if (!apiUrl.startsWith('http')) {
      apiUrl = `https://${apiUrl}`;
    }
    apiUrl = apiUrl.replace(/\/$/, '');

    console.log('=== CANVAS GRADE DEBUGGING STARTED ===');
    console.log('API URL:', apiUrl);

    // Get all enrolled courses with detailed info
    const coursesResponse = await fetch(`${apiUrl}/api/v1/courses?enrollment_state=active&include[]=total_scores&per_page=100`, {
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Courses response status:', coursesResponse.status);
    
    if (!coursesResponse.ok) {
      const errorText = await coursesResponse.text();
      console.error('Courses fetch failed:', errorText);
      throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
    }

    const courses = await coursesResponse.json();
    const validCourses = courses.filter((course: any) => course.name && course.id);
    
    console.log(`Found ${validCourses.length} valid courses:`, validCourses.map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.course_code,
      has_total_scores: !!c.total_scores
    })));

    const calculatedGrades = [];
    
    for (const course of validCourses) {
      try {
        console.log(`\n=== PROCESSING COURSE: ${course.name} (ID: ${course.id}) ===`);
        
        const gradeInfo = await debugCourseGrade(apiUrl, canvasApiKey, course);
        calculatedGrades.push(gradeInfo);
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay
        
      } catch (error) {
        console.error(`Error processing course ${course.name}:`, error);
        calculatedGrades.push({
          course_id: course.id,
          course_name: course.name,
          course_code: course.course_code,
          error: error instanceof Error ? error.message : 'Unknown error',
          debug: { step: 'course_processing' },
          calculatedGrade: null,
          calculatedScore: null
        });
      }
    }

    console.log('=== CANVAS GRADE DEBUGGING COMPLETED ===');
    console.log('Results:', calculatedGrades);

    return NextResponse.json({
      success: true,
      grades: calculatedGrades,
      debug: {
        totalCourses: validCourses.length,
        coursesWithGrades: calculatedGrades.filter(g => g.calculatedScore !== null).length,
        timestamp: new Date().toISOString()
      },
      lastSynced: new Date().toISOString()
    });

  } catch (error) {
    console.error('Canvas calculated grades error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate grades from Canvas.',
        debugError: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function debugCourseGrade(apiUrl: string, apiKey: string, course: any) {
  const debugInfo: any = { steps: [] };
  
  // Step 1: Check enrollments for grades
  debugInfo.steps.push('Checking enrollments');
  try {
    const enrollmentsUrl = `${apiUrl}/api/v1/courses/${course.id}/enrollments?user_id=self`;
    console.log('Enrollments URL:', enrollmentsUrl);
    
    const enrollmentsResponse = await fetch(enrollmentsUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    debugInfo.enrollmentsStatus = enrollmentsResponse.status;
    
    if (enrollmentsResponse.ok) {
      const enrollments = await enrollmentsResponse.json();
      const studentEnrollment = enrollments.find((e: any) => e.type === 'StudentEnrollment');
      
      debugInfo.enrollmentsFound = enrollments.length;
      debugInfo.studentEnrollment = !!studentEnrollment;
      
      if (studentEnrollment?.grades) {
        console.log('Found grades in enrollments:', studentEnrollment.grades);
        debugInfo.gradesFromEnrollments = studentEnrollment.grades;
        
        if (studentEnrollment.grades.current_score !== null) {
          return {
            course_id: course.id,
            course_name: course.name,
            course_code: course.course_code,
            calculatedGrade: studentEnrollment.grades.current_grade,
            calculatedScore: studentEnrollment.grades.current_score,
            totalPoints: studentEnrollment.grades.final_points,
            earnedPoints: studentEnrollment.grades.current_points,
            dataSource: 'enrollments',
            debug: debugInfo
          };
        }
      }
    }
  } catch (error) {
    debugInfo.enrollmentsError = error instanceof Error ? error.message : 'Unknown error';
    console.log('Enrollments step failed:', error);
  }

  // Step 2: Check assignments
  debugInfo.steps.push('Checking assignments');
  try {
    const assignmentsUrl = `${apiUrl}/api/v1/courses/${course.id}/assignments?per_page=10`; // Limit to 10 for testing
    console.log('Assignments URL:', assignmentsUrl);
    
    const assignmentsResponse = await fetch(assignmentsUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    debugInfo.assignmentsStatus = assignmentsResponse.status;
    
    if (assignmentsResponse.ok) {
      const assignments = await assignmentsResponse.json();
      debugInfo.assignmentsFound = assignments.length;
      debugInfo.assignmentsWithPoints = assignments.filter((a: any) => a.points_possible > 0).length;
      
      console.log(`Found ${assignments.length} assignments, ${debugInfo.assignmentsWithPoints} with points`);
      
      // Check if any assignments are graded
      const gradedAssignments = assignments.filter((a: any) => 
        a.submission && a.submission.workflow_state === 'graded'
      );
      debugInfo.gradedAssignments = gradedAssignments.length;
      
      if (gradedAssignments.length > 0) {
        console.log('Graded assignments found:', gradedAssignments);
      }
    } else {
      const errorText = await assignmentsResponse.text();
      debugInfo.assignmentsError = errorText;
    }
  } catch (error) {
    debugInfo.assignmentsError = error instanceof Error ? error.message : 'Unknown error';
    console.log('Assignments step failed:', error);
  }

  // Step 3: Check if course has total_scores from initial fetch
  if (course.total_scores) {
    debugInfo.steps.push('Checking total_scores');
    debugInfo.totalScores = course.total_scores;
    
    if (course.total_scores.current_score !== null) {
      console.log('Found grades in total_scores:', course.total_scores);
      return {
        course_id: course.id,
        course_name: course.name,
        course_code: course.course_code,
        calculatedGrade: null, // total_scores doesn't provide letter grade
        calculatedScore: course.total_scores.current_score,
        totalPoints: course.total_scores.final_points,
        earnedPoints: course.total_scores.current_points,
        dataSource: 'total_scores',
        debug: debugInfo
      };
    }
  }

  debugInfo.finalResult = 'No grade data found';
  console.log(`No grade data found for course ${course.name}`);
  
  return {
    course_id: course.id,
    course_name: course.name,
    course_code: course.course_code,
    calculatedGrade: null,
    calculatedScore: null,
    debug: debugInfo
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}