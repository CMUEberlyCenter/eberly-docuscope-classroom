#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Aug 16 10:00:08 2017
For Suguru: group selector

@author: hseltman
"""
import copy
import random

import pandas


def get_best_groups(dtf, group_size=2, min_group_size=2, #pylint: disable=R0913
                    nsim=10000, randomize=True, verbose=False):
    """ Get the best set student groups of size 'group_size' among 'nsim'
        random groupings.  Each run, left-over students are in a group of
        their own or added to other groups based on 'min_group_size'.

        The "quality" of a single group of students is defined as the maximum
        difference among all comparisons of paris of students in the group
        across all available DocusScope categories.

        The "quality" of "student grouping", i.e., an assignment of students
        in a class to a set of student groups, is defined as the minimum
        of all of the qualities of the student groups.

        "Best" is defined the student grouping with the highest "quality"
        among all random student groupings tested.

        'dtf': a pandas dataFrame for a classroom with one row per student,
            columns for each DocuScope category, and student names as the
            index
        'group_size': the desired number of students per group
        'min_group_size': if the number of left-over students is less than
            this number, they will be added to other groups
        'nsim': number of random groupings to try
        'randomize': False is for testing only (groups differ on reapeat runs
            only if there are ties)
        'verbose': True shows at which simluation numbers improvements are
            found.  This might lend some insight into choosing 'nsim'.

        The return value is a dictionary with these elements:
            'groups': a list of lists, with the outer elements being student
                groups, and the inner elements being student ids
            'qualities': the qualities of the individual groups
            'quality': the quality of the worst group in the grouping
    """
    # Verify input
    if not isinstance(dtf, pandas.core.frame.DataFrame):
        raise TypeError("'dtf' is not a pandas DataFrame")
    if not isinstance(group_size, int):
        raise TypeError("'group_size' is not an integer")
    if not isinstance(min_group_size, int):
        raise TypeError("'min_group_size' is not an integer")
    if not isinstance(nsim, int):
        raise TypeError("'nsim' is not an integer")

    num = dtf.shape[0]
    k = dtf.shape[1]
    if k < 2:
        raise ValueError("Need at least two DocuScope categories.")
    if num < 4:
        raise ValueError("Need at least four students in a class.")
    if group_size < 2 or group_size > num/2:
        raise ValueError("Group Size must be between 2 and half the number" +\
                        " of students.")
    if min_group_size < 2 or min_group_size > group_size:
        raise ValueError("Invalid 'min_group_size'.")
    if nsim < 1 or nsim > 10000000:
        raise ValueError("'nsim' should be between 2 and 10,000,000.")

    # Format data as a list of lists and an index list
    lst = [dtf.iloc[i, :].tolist() for i in range(dtf.shape[0])]
    labels = list(dtf.index)

    # Find best grouping
    return make_pairs_all(lst, labels, group_size=group_size,
                          min_group_size=min_group_size, nsim=nsim,
                          randomize=randomize, verbose=verbose)

def max_abs_diff(x_values, y_values):
    """ Given two commensurate lists of k numbers, return the maximum
        of the k differences.
    """
    diffs = [abs(a-b) for (a, b) in zip(x_values, y_values)]
    return max(diffs)

def order(vals, small=0.01):
    """ Given a list of values, return a list of the indices of the largest
        value, next to largest, etc.
        Uses 'small' to add random values of that order of magnitude to
        resolve ties (if needed)
    """
    max_cpy = max(vals.count(i) for i in vals)
    slav = copy.copy(vals)
    slav.sort(reverse=True)
    if max_cpy > 1:
        vals = [i + random.uniform(-small, small) for i in vals] # nosec
        slav = copy.copy(vals)
        slav.sort(reverse=True)
    return [vals.index(i) for i in slav]


def make_pairs(data, ids, group_size, min_group_size, randomize=True): #pylint: disable=R0914
    """
    This is the core function.  It takes classroom information in the form of:
        'data': a list containing one element per student, where each element
                is a list of, say, 'k' DocuScope scores
        'ids': a list of strings identifying the elements of 'data'
        'group_size': the desired number of students per group
        'randomize': False is for testing only (groups differ on reapeat runs
                only if there are ties)

    Student groups are formed by this algorithm:
        1) Compute 'ng', the number of complete groups possible for the
            given number of students.
        2) Choose an index student at random.
        2) For each other students compute the maximum single item difference
            from the index student across all k DocuScope scores.
        3) Choose the ng - 1 students with the largest maximums to join the
            index student to form a group
        4) Remove the group from the data, and go back to step 2) if there
            are more complete groups to assemble.
        5) If there are remaining students, place them in 'extra'

    Return a dictionary with elements:
        'groups': a list of lists with one outer element per student group and
            inner elements that are lists of the student ids for the group
        'extra': a list of ids of left-over students
        'qualities': a list of length 'k' with the "quality" of the class
            grouping as the minumum in each group of the k maximums.
        'quality': the maximum of the 'qualities'
    """
    num_students = len(data)
    num_groups = num_students // group_size
    grps = []
    qualities = []

    # Loop to create each complete group
    for grp in range(num_groups):
        # Last group may be deterministic
        if grp == num_groups - 1 and num_students == group_size:
            grps.append(ids)
            ids = []
            qualities.append(max(max_abs_diff(data[0], b) for b in data[1:]))
        else:
            if randomize:
                # Swap first student with a random student ('data' and 'ids')
                sel = random.sample(range(num_students), 1)[0]
                if sel != 0:
                    temp = copy.copy(data[sel])
                    data[sel] = data[0]
                    data[0] = temp
                    (ids[sel], ids[0]) = (ids[0], ids[sel])
            # Compute biggest difference (across k scores) for each student
            # from the first (index) student.
            mad = [max_abs_diff(data[0], b) for b in data[1:]]
            # Choose students to join the index student.
            others = order(mad)[:group_size-1]
            # Compute group quality (tentative, as left-overs may join later).
            qualities.append(min(d for (i, d) in enumerate(mad) if i in others))
            # Store student ids in 'grp'
            this_group = [0] + [i + 1 for i in others]
            grps.append([ids[i] for i in range(num_students) if i in this_group])
            # Clean up for next iteration.
            ids = [ids[i] for i in range(num_students) if i not in this_group]
            data = [data[i] for i in range(num_students) if i not in this_group]
            num_students -= group_size

    n_left = len(ids)
    if n_left > 0 and n_left >= min_group_size:
        grps.append(ids)
        extra = []
        qualities.append(min(max_abs_diff(data[0], b) for b in data[1:]))
    else:
        extra = ids

    return {'groups': grps, 'extra': extra, 'qualities': qualities,
            'quality': min(qualities)}

def make_pairs_all(data, ids, group_size, #pylint: disable=R0913
                   min_group_size=2, nsim=10000,
                   randomize=True, verbose=False):
    """
    Generate 'nsim' random groupings of students, returning the best one.
    The input is classroom information in the form of:
        'data': a list containing one element per student, where each element
            is a list of, say, 'k' DocuScope scores
        'ids': a list of strings identifying the elements of 'data'
        'group_size': the desired number of students per group
        'min_group_size': if the number of left-over students is less than
            this number, they will be added to other groups
        'nsim': number of random groupings to try
        'randomize': False is for testing only (groups differ on reapeat runs
                only if there are ties)
    Return value is a dictionary like from make_pairs(), but without 'extra'.
    """
    best_group = {'quality': float('-inf')}
    for i_sim in range(nsim):
        # generate a grouping, possibly with left-over students
        trial = make_pairs(data=data, ids=ids, group_size=group_size,
                           min_group_size=min_group_size,
                           randomize=randomize)
        # Adjust for left-over students (may have improved quality)
        n_left = len(trial['extra'])
        if 0 < n_left < min_group_size:
            num_groups = len(trial['groups'])
            for left_index in range(n_left):
                index = left_index % num_groups
                trial['groups'][index].append(trial['extra'][left_index])
                this_quality = max_dist_one_to_many(data, ids,
                                                    trial['groups'][index])
                if this_quality > trial['qualities'][index]:
                    trial['qualities'][index] = this_quality

        if best_group is None or trial['quality'] > best_group['quality']:
            if verbose and best_group is not None:
                print(str(i_sim) + ": " + str(best_group['quality']) + \
                      " ->  " + str(trial['quality']))
            best_group = copy.copy(trial)

    return {'groups': best_group['groups'],
            'grp_qualities': best_group['qualities'],
            'quality': best_group['quality']}

def max_dist_one_to_many(data, all_ids, group_ids):
    """
    Given complete data find maximum distance (across DocuScope categories)
    between last student and each of the others.  Return the maximum of those
    distances.

    'data' is a list of lists with the outer list being groups and the inner
        list being DocusScope scores for those students.
    'all_ids' is the list of student ids
    'group_ids' is a list of student ids for one group, where the last was
        just added and needs to be compared to the rest.
    """
    max_diff = 0.0
    num_ids = len(group_ids)
    indices = [all_ids.index(i) for i in group_ids]
    for i in range(num_ids-1):
        mad = max_abs_diff(data[indices[num_ids-1]], data[indices[i]])
        if mad > max_diff:
            max_diff = mad
    return max_diff


# # Test code
# import pandas as pd
# dat = pd.read_csv("ds_sample.csv",  index_col=0)

# print("twos")
# twos = get_best_from_dataFrame(dat, group_size=2)
# print(twos)

# print("\nthrees")
# threes = get_best_from_dataFrame(dat, group_size=3)
# print(threes)

# print("\nseven plus")
# # With 16 students in groups of 7, 2 are left over
# # Default min_group_size of 2, these form a small group
# sevenPlus = get_best_from_dataFrame(dat, group_size=7)
# print(sevenPlus)

# print("\nseven seeded")
# # With a minimum of 3 per group, the extras are "seeded" into the others
# sevenSeeded = get_best_from_dataFrame(dat, group_size=7, min_group_size=3)
# print(sevenSeeded)

# print("\nlong run")
# # There are no guarantees about whether longer runs are going to produce
# # significantly better groups.  I suggest that you code nsim=10000, then
# # check the 'quality' against an arbitrary standard, and run once more
# # with nsim=100000 or nsim=500000 if the short run does not exceed that
# # minimum quality.
# print(get_best_from_dataFrame(dat, group_size=2, nsim=100000))
